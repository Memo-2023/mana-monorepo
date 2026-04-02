package sync

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/manacore/mana-sync/internal/auth"
	"github.com/manacore/mana-sync/internal/store"
	"github.com/manacore/mana-sync/internal/ws"
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

		err := h.store.RecordChange(ctx, appID, change.Table, change.ID, userID, change.Op, clientID, data, fieldTimestamps)
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
		c := Change{
			Table: row.TableName,
			ID:    row.RecordID,
			Op:    row.Op,
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
				c.Fields[field] = &FieldChange{
					Value:     value,
					UpdatedAt: ts,
				}
			}
		case "delete":
			if deletedAt, ok := row.Data["deletedAt"].(string); ok {
				c.DeletedAt = &deletedAt
			}
		}

		responseChanges = append(responseChanges, c)
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)

	resp := SyncResponse{
		ServerChanges: responseChanges,
		Conflicts:     []SyncConflict{}, // Field-level LWW doesn't produce conflicts
		SyncedUntil:   now,
	}

	// Notify other connected clients via WebSocket
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
		c := Change{
			Table: row.TableName,
			ID:    row.RecordID,
			Op:    row.Op,
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
				c.Fields[field] = &FieldChange{
					Value:     value,
					UpdatedAt: ts,
				}
			}
		case "delete":
			if deletedAt, ok := row.Data["deletedAt"].(string); ok {
				c.DeletedAt = &deletedAt
			}
		}

		responseChanges = append(responseChanges, c)
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
