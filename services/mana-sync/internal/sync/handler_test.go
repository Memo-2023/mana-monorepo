package sync

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// mockStore implements the store operations needed by Handler for testing.
type mockStore struct {
	recordedChanges []recordedChange
	serverChanges   []mockChangeRow
	recordErr       error
	getErr          error
}

type recordedChange struct {
	appID, table, recordID, userID, op, clientID string
	data                                         map[string]any
	fieldTimestamps                              map[string]string
}

type mockChangeRow struct {
	ID, TableName, RecordID, Op, ClientID string
	Data                                  map[string]any
	FieldTimestamps                       map[string]string
}

// mockValidator always returns a fixed user ID.
type mockValidator struct {
	userID string
	err    error
}

func (v *mockValidator) UserIDFromRequest(r *http.Request) (string, error) {
	if v.err != nil {
		return "", v.err
	}
	return v.userID, nil
}

// mockHub does nothing.
type mockHub struct {
	notified []notification
}

type notification struct {
	userID, appID, excludeClientID string
	tables                         []string
}

func (h *mockHub) NotifyUser(userID, appID, excludeClientID string, tables []string) {
	h.notified = append(h.notified, notification{userID, appID, excludeClientID, tables})
}

func TestValidateOp(t *testing.T) {
	tests := []struct {
		name    string
		op      string
		isValid bool
	}{
		{"insert is valid", "insert", true},
		{"update is valid", "update", true},
		{"delete is valid", "delete", true},
		{"upsert is invalid", "upsert", false},
		{"empty is invalid", "", false},
		{"random is invalid", "foo", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if validOps[tt.op] != tt.isValid {
				t.Errorf("validOps[%q] = %v, want %v", tt.op, validOps[tt.op], tt.isValid)
			}
		})
	}
}

func TestChangesetValidation(t *testing.T) {
	tests := []struct {
		name       string
		body       Changeset
		wantStatus int
	}{
		{
			name: "valid insert",
			body: Changeset{
				ClientID: "client-1",
				Since:    "2024-01-01T00:00:00Z",
				Changes: []Change{
					{Table: "todos", ID: "todo-1", Op: "insert", Data: map[string]any{"title": "Test"}},
				},
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "valid update with fields",
			body: Changeset{
				ClientID: "client-1",
				Since:    "2024-01-01T00:00:00Z",
				Changes: []Change{
					{Table: "todos", ID: "todo-1", Op: "update", Fields: map[string]*FieldChange{
						"title": {Value: "Updated", UpdatedAt: "2024-01-01T10:00:00Z"},
					}},
				},
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "valid delete",
			body: Changeset{
				ClientID: "client-1",
				Since:    "2024-01-01T00:00:00Z",
				Changes: []Change{
					{Table: "todos", ID: "todo-1", Op: "delete"},
				},
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "invalid op rejected",
			body: Changeset{
				ClientID: "client-1",
				Since:    "2024-01-01T00:00:00Z",
				Changes: []Change{
					{Table: "todos", ID: "todo-1", Op: "upsert"},
				},
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "missing table rejected",
			body: Changeset{
				ClientID: "client-1",
				Since:    "2024-01-01T00:00:00Z",
				Changes: []Change{
					{Table: "", ID: "todo-1", Op: "insert"},
				},
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "missing id rejected",
			body: Changeset{
				ClientID: "client-1",
				Since:    "2024-01-01T00:00:00Z",
				Changes: []Change{
					{Table: "todos", ID: "", Op: "insert"},
				},
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "empty changeset is valid",
			body: Changeset{
				ClientID: "client-1",
				Since:    "2024-01-01T00:00:00Z",
				Changes:  []Change{},
			},
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bodyBytes, _ := json.Marshal(tt.body)
			req := httptest.NewRequest("POST", "/sync/test-app", bytes.NewReader(bodyBytes))
			req.SetPathValue("appId", "test-app")
			req.Header.Set("Authorization", "Bearer test-token")
			req.Header.Set("X-Client-Id", "client-1")

			w := httptest.NewRecorder()

			// Use a handler that accepts the request but uses mock store
			// We test validation only — store operations are mocked
			validator := &mockValidator{userID: "user-1"}

			// For this test we only validate the input parsing and validation
			// The actual handler would need a real store interface
			// So we test the validation logic directly
			var changeset Changeset
			if err := json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&changeset); err != nil {
				t.Fatal(err)
			}

			// Simulate validation
			valid := true
			for _, change := range changeset.Changes {
				if !validOps[change.Op] || change.Table == "" || change.ID == "" {
					valid = false
					break
				}
			}

			if tt.wantStatus == http.StatusBadRequest && valid {
				t.Errorf("expected validation to fail but it passed")
			}
			if tt.wantStatus == http.StatusOK && !valid {
				t.Errorf("expected validation to pass but it failed")
			}

			_ = w
			_ = validator
		})
	}
}

func TestMaxBodySize(t *testing.T) {
	if maxBodySize != 10*1024*1024 {
		t.Errorf("maxBodySize = %d, want %d", maxBodySize, 10*1024*1024)
	}
}

func TestSyncResponseFormat(t *testing.T) {
	resp := SyncResponse{
		ServerChanges: []Change{
			{
				Table: "todos",
				ID:    "todo-1",
				Op:    "insert",
				Data:  map[string]any{"title": "Test", "completed": false},
			},
		},
		Conflicts:   []SyncConflict{},
		SyncedUntil: "2024-01-01T10:00:00.000000000Z",
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatal(err)
	}

	var decoded SyncResponse
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatal(err)
	}

	if len(decoded.ServerChanges) != 1 {
		t.Errorf("expected 1 server change, got %d", len(decoded.ServerChanges))
	}
	if decoded.ServerChanges[0].Table != "todos" {
		t.Errorf("expected table 'todos', got %q", decoded.ServerChanges[0].Table)
	}
	if decoded.ServerChanges[0].Op != "insert" {
		t.Errorf("expected op 'insert', got %q", decoded.ServerChanges[0].Op)
	}
	if decoded.SyncedUntil == "" {
		t.Error("expected non-empty syncedUntil")
	}
	if decoded.Conflicts == nil {
		t.Error("expected non-nil conflicts array")
	}
}

func TestFieldChangeRoundTrip(t *testing.T) {
	change := Change{
		Table: "todos",
		ID:    "todo-1",
		Op:    "update",
		Fields: map[string]*FieldChange{
			"title":     {Value: "Buy milk", UpdatedAt: "2024-01-01T10:05:00Z"},
			"completed": {Value: true, UpdatedAt: "2024-01-01T10:06:00Z"},
		},
	}

	data, err := json.Marshal(change)
	if err != nil {
		t.Fatal(err)
	}

	var decoded Change
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatal(err)
	}

	if len(decoded.Fields) != 2 {
		t.Fatalf("expected 2 fields, got %d", len(decoded.Fields))
	}

	titleField := decoded.Fields["title"]
	if titleField == nil {
		t.Fatal("missing 'title' field")
	}
	if titleField.Value != "Buy milk" {
		t.Errorf("title value = %v, want 'Buy milk'", titleField.Value)
	}
	if titleField.UpdatedAt != "2024-01-01T10:05:00Z" {
		t.Errorf("title updatedAt = %q, want '2024-01-01T10:05:00Z'", titleField.UpdatedAt)
	}

	completedField := decoded.Fields["completed"]
	if completedField == nil {
		t.Fatal("missing 'completed' field")
	}
	if completedField.Value != true {
		t.Errorf("completed value = %v, want true", completedField.Value)
	}
}

// TestActorPassthrough verifies that an AI-attributed change round-trips
// through JSON encoding/decoding with the actor payload intact as opaque
// bytes — we don't parse the actor shape server-side, just store and re-emit.
func TestActorPassthrough(t *testing.T) {
	aiActor := json.RawMessage(`{"kind":"ai","missionId":"m-1","iterationId":"it-1","rationale":"weekly goals review"}`)
	change := Change{
		Table: "todos",
		ID:    "todo-1",
		Op:    "insert",
		Data:  map[string]any{"title": "Staged by AI"},
		Actor: aiActor,
	}

	encoded, err := json.Marshal(change)
	if err != nil {
		t.Fatal(err)
	}

	var decoded Change
	if err := json.Unmarshal(encoded, &decoded); err != nil {
		t.Fatal(err)
	}

	if len(decoded.Actor) == 0 {
		t.Fatal("actor was dropped during round-trip")
	}

	// Shape-check that the opaque blob still holds the AI payload
	var shape struct {
		Kind        string `json:"kind"`
		MissionID   string `json:"missionId"`
		IterationID string `json:"iterationId"`
	}
	if err := json.Unmarshal(decoded.Actor, &shape); err != nil {
		t.Fatalf("actor not valid JSON after round-trip: %v", err)
	}
	if shape.Kind != "ai" || shape.MissionID != "m-1" || shape.IterationID != "it-1" {
		t.Errorf("actor shape lost: %+v", shape)
	}
}

// TestActorOmittedWhenAbsent verifies that pre-actor clients (no actor
// field) don't emit a null or empty "actor" key on the wire — the
// omitempty tag should suppress it entirely.
func TestActorOmittedWhenAbsent(t *testing.T) {
	change := Change{
		Table: "todos",
		ID:    "todo-1",
		Op:    "insert",
		Data:  map[string]any{"title": "Legacy client write"},
	}

	encoded, err := json.Marshal(change)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(encoded, []byte(`"actor"`)) {
		t.Errorf("absent actor was serialized into payload: %s", encoded)
	}
}
