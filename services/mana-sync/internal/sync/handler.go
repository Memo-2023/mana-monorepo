package sync

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/mana/mana-sync/internal/auth"
	"github.com/mana/mana-sync/internal/store"
	"github.com/mana/mana-sync/internal/ws"
)

// Handler handles sync HTTP endpoints.
type Handler struct {
	store     *store.Store
	validator *auth.Validator
	hub       *ws.Hub
}

// NewHandler creates a new sync handler.
func NewHandler(s *store.Store, v *auth.Validator, h *ws.Hub) *Handler {
	return &Handler{store: s, validator: v, hub: h}
}

// maxBodySize is the maximum allowed request body (10 MB).
const maxBodySize = 10 * 1024 * 1024

// changeFromRow projects a stored sync_changes row onto the wire Change shape.
// Carries eventId + schemaVersion through so clients can dedup on replay and
// route through the migration chain.
func changeFromRow(row store.ChangeRow) Change {
	sv := row.SchemaVersion
	if sv <= 0 {
		sv = 1
	}
	c := Change{
		EventID:       row.ID,
		SchemaVersion: sv,
		Table:         row.TableName,
		ID:            row.RecordID,
		Op:            row.Op,
	}
	switch row.Op {
	case "insert":
		c.Data = row.Data
	case "update":
		c.Fields = make(map[string]*FieldChange)
		for field, ts := range row.FieldTimestamps {
			value, ok := row.Data[field]
			if !ok {
				continue
			}
			c.Fields[field] = &FieldChange{Value: value, UpdatedAt: ts}
		}
	case "delete":
		if deletedAt, ok := row.Data["deletedAt"].(string); ok {
			c.DeletedAt = &deletedAt
		}
	}
	return c
}

// validOps are the allowed sync operation types.
var validOps = map[string]bool{"insert": true, "update": true, "delete": true}

// HandleSync processes a POST /sync/:appId request.
// Receives a changeset from a client, records changes, and returns the server delta.
func (h *Handler) HandleSync(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Authenticate
	userID, err := h.validator.UserIDFromRequest(r)
	if err != nil {
		http.Error(w, "unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	// Parse app ID from path: /sync/{appId}
	appID := r.PathValue("appId")
	if appID == "" {
		http.Error(w, "missing appId", http.StatusBadRequest)
		return
	}

	// Limit request body size
	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)

	// Parse changeset
	var changeset Changeset
	if err := json.NewDecoder(r.Body).Decode(&changeset); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Normalize + validate protocol version. Pre-M2 clients omit the field
	// (treated as v1); a client newer than this build is refused so we don't
	// silently store events we can't fully interpret.
	schemaVersion := changeset.SchemaVersion
	if schemaVersion <= 0 {
		schemaVersion = 1
	}
	if schemaVersion > MaxSupportedSchemaVersion {
		http.Error(w, fmt.Sprintf("unsupported schemaVersion %d (max %d)", schemaVersion, MaxSupportedSchemaVersion), http.StatusBadRequest)
		return
	}

	// Validate changes
	for i, change := range changeset.Changes {
		if !validOps[change.Op] {
			http.Error(w, fmt.Sprintf("invalid op %q in change %d", change.Op, i), http.StatusBadRequest)
			return
		}
		if change.Table == "" || change.ID == "" {
			http.Error(w, fmt.Sprintf("missing table or id in change %d", i), http.StatusBadRequest)
			return
		}
	}

	ctx := r.Context()
	clientID := r.Header.Get("X-Client-Id")
	if clientID == "" {
		clientID = changeset.ClientID
	}

	// Process each change
	affectedTables := make(map[string]struct{})
	for _, change := range changeset.Changes {
		affectedTables[change.Table] = struct{}{}

		// Build data and field timestamps
		data := change.Data
		fieldTimestamps := make(map[string]string)

		if change.Op == "update" && change.Fields != nil {
			data = make(map[string]any)
			for field, fc := range change.Fields {
				data[field] = fc.Value
				fieldTimestamps[field] = fc.UpdatedAt
			}
		}

		if change.Op == "delete" {
			if data == nil {
				data = make(map[string]any)
			}
			if change.DeletedAt != nil {
				data["deletedAt"] = *change.DeletedAt
			}
		}

		// Per-change schemaVersion falls back to the changeset-level value
		// so a well-formed pre-M2 change nested in an M2 changeset still
		// lands on the right version.
		rowSchemaVersion := change.SchemaVersion
		if rowSchemaVersion <= 0 {
			rowSchemaVersion = schemaVersion
		}
		err := h.store.RecordChange(ctx, appID, change.Table, change.ID, userID, change.Op, clientID, data, fieldTimestamps, rowSchemaVersion)
		if err != nil {
			slog.Error("failed to record change", "error", err, "table", change.Table, "id", change.ID)
			http.Error(w, "failed to record change: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// Get server changes since client's last sync (excluding client's own changes)
	serverChanges, err := h.store.GetAllChangesSince(ctx, userID, appID, changeset.Since, clientID)
	if err != nil {
		slog.Error("failed to get server changes", "error", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	// Convert store rows to sync changes
	responseChanges := make([]Change, 0, len(serverChanges))
	for _, row := range serverChanges {
		responseChanges = append(responseChanges, changeFromRow(row))
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)

	resp := SyncResponse{
		ServerChanges: responseChanges,
		Conflicts:     []SyncConflict{}, // Field-level LWW doesn't produce conflicts
		SyncedUntil:   now,
	}

	// Notify other connected clients via WebSocket/SSE
	if len(affectedTables) > 0 {
		tables := make([]string, 0, len(affectedTables))
		for t := range affectedTables {
			tables = append(tables, t)
		}
		h.hub.NotifyUser(userID, appID, clientID, tables)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// HandlePull processes a GET /sync/:appId/pull request.
// Returns server changes for a specific collection since a timestamp.
func (h *Handler) HandlePull(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.validator.UserIDFromRequest(r)
	if err != nil {
		http.Error(w, "unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	appID := r.PathValue("appId")
	if appID == "" {
		http.Error(w, "missing appId", http.StatusBadRequest)
		return
	}

	collection := r.URL.Query().Get("collection")
	since := r.URL.Query().Get("since")
	clientID := r.Header.Get("X-Client-Id")

	if collection == "" || since == "" {
		http.Error(w, "missing collection or since parameter", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	const batchLimit = 1000
	serverChanges, err := h.store.GetChangesSince(ctx, userID, appID, collection, since, clientID, batchLimit+1)
	if err != nil {
		slog.Error("failed to get changes", "error", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	// Check if there are more rows than the batch limit
	hasMore := len(serverChanges) > batchLimit
	if hasMore {
		serverChanges = serverChanges[:batchLimit]
	}

	responseChanges := make([]Change, 0, len(serverChanges))
	for _, row := range serverChanges {
		responseChanges = append(responseChanges, changeFromRow(row))
	}

	// When paginating, use last row's timestamp as cursor; otherwise now()
	var syncedUntil string
	if hasMore && len(serverChanges) > 0 {
		syncedUntil = serverChanges[len(serverChanges)-1].CreatedAt.UTC().Format(time.RFC3339Nano)
	} else {
		syncedUntil = time.Now().UTC().Format(time.RFC3339Nano)
	}

	resp := SyncResponse{
		ServerChanges: responseChanges,
		Conflicts:     []SyncConflict{},
		SyncedUntil:   syncedUntil,
		HasMore:       hasMore,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// HandleStream provides a Server-Sent Events (SSE) endpoint that streams
// changes to the client in real-time. Replaces the WebSocket notification +
// HTTP pull round-trip with a single persistent connection.
//
// GET /sync/{appId}/stream?collections=tasks,projects&since=2024-01-01T10:00:00Z
func (h *Handler) HandleStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.validator.UserIDFromRequest(r)
	if err != nil {
		http.Error(w, "unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	appID := r.PathValue("appId")
	if appID == "" {
		http.Error(w, "missing appId", http.StatusBadRequest)
		return
	}

	clientID := r.Header.Get("X-Client-Id")
	since := r.URL.Query().Get("since")
	if since == "" {
		since = "1970-01-01T00:00:00.000Z"
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	// SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ctx := r.Context()
	const batchLimit = 1000

	// Parse requested collections
	var collections []string
	if q := r.URL.Query().Get("collections"); q != "" {
		for _, c := range strings.Split(q, ",") {
			c = strings.TrimSpace(c)
			if c != "" {
				collections = append(collections, c)
			}
		}
	}

	// Track cursors per collection — default to now() if no initial data
	now := time.Now().UTC().Format(time.RFC3339Nano)
	cursors := make(map[string]string)
	for _, coll := range collections {
		cursors[coll] = since
	}

	// Initial sync: send pending changes since cursor for each collection
	for _, coll := range collections {
		changes, err := h.store.GetChangesSince(ctx, userID, appID, coll, since, clientID, batchLimit+1)
		if err != nil {
			slog.Error("SSE initial pull failed", "error", err, "collection", coll)
			cursors[coll] = now // Default to now on error
			continue
		}

		hasMore := len(changes) > batchLimit
		if hasMore {
			changes = changes[:batchLimit]
		}

		if len(changes) > 0 {
			cursor := changes[len(changes)-1].CreatedAt.UTC().Format(time.RFC3339Nano)
			cursors[coll] = cursor
			sendChangeEvent(w, coll, h.convertChanges(changes), cursor, hasMore)
			flusher.Flush()
		} else {
			// No initial data — set cursor to now so live updates work
			cursors[coll] = now
		}
	}

	// Subscribe to hub notifications for real-time updates
	ch := h.hub.Subscribe(userID)
	defer h.hub.Unsubscribe(userID, ch)

	heartbeat := time.NewTicker(30 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case notification := <-ch:
			if notification.AppID != appID {
				continue
			}
			for _, table := range notification.Tables {
				cursor := cursors[table]
				if cursor == "" {
					cursor = since
				}
				changes, err := h.store.GetChangesSince(ctx, userID, appID, table, cursor, clientID, batchLimit+1)
				if err != nil || len(changes) == 0 {
					continue
				}
				hasMore := len(changes) > batchLimit
				if hasMore {
					changes = changes[:batchLimit]
				}
				newCursor := changes[len(changes)-1].CreatedAt.UTC().Format(time.RFC3339Nano)
				cursors[table] = newCursor
				sendChangeEvent(w, table, h.convertChanges(changes), newCursor, hasMore)
				flusher.Flush()
			}

		case <-heartbeat.C:
			fmt.Fprint(w, "event: heartbeat\ndata: {}\n\n")
			flusher.Flush()

		case <-ctx.Done():
			return
		}
	}
}

// convertChanges transforms store rows into sync Change objects.
func (h *Handler) convertChanges(rows []store.ChangeRow) []Change {
	changes := make([]Change, 0, len(rows))
	for _, row := range rows {
		c := Change{Table: row.TableName, ID: row.RecordID, Op: row.Op}
		switch row.Op {
		case "insert":
			c.Data = row.Data
		case "update":
			c.Fields = make(map[string]*FieldChange)
			for field, ts := range row.FieldTimestamps {
				if value, ok := row.Data[field]; ok {
					c.Fields[field] = &FieldChange{Value: value, UpdatedAt: ts}
				}
			}
		case "delete":
			if deletedAt, ok := row.Data["deletedAt"].(string); ok {
				c.DeletedAt = &deletedAt
			}
		}
		changes = append(changes, c)
	}
	return changes
}

func sendChangeEvent(w http.ResponseWriter, table string, changes []Change, syncedUntil string, hasMore bool) {
	event := map[string]any{
		"table": table, "changes": changes,
		"syncedUntil": syncedUntil, "hasMore": hasMore,
	}
	data, _ := json.Marshal(event)
	fmt.Fprintf(w, "event: changes\ndata: %s\n\n", data)
}
