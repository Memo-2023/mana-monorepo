// Package backup implements the M1 thin-slice user-data backup endpoint.
//
// Streams every sync_changes row owned by the authenticated user as JSON Lines
// (one Change per line). The body is the raw event stream from mana-sync —
// identical in shape to what live sync emits, so a future restore endpoint can
// replay it via the existing applyServerChanges() path on the client.
//
// Field-level ciphertext passes through untouched: the registry-encrypted
// fields are already encrypted when they reach this table, so the file is
// effectively encrypted at rest for sensitive fields.
package backup

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/mana/mana-sync/internal/auth"
	"github.com/mana/mana-sync/internal/store"
)

// Handler serves the /backup/export endpoint.
type Handler struct {
	store     *store.Store
	validator *auth.Validator
}

// NewHandler constructs a backup handler.
func NewHandler(s *store.Store, v *auth.Validator) *Handler {
	return &Handler{store: s, validator: v}
}

// exportLine is the on-wire shape of one row in the JSONL body. Field names
// mirror the sync-protocol Change shape as closely as possible; the restore
// side maps these back into SyncChange objects.
type exportLine struct {
	EventID         string            `json:"eventId"`
	SchemaVersion   int               `json:"schemaVersion"`
	AppID           string            `json:"appId"`
	Table           string            `json:"table"`
	RecordID        string            `json:"id"`
	Op              string            `json:"op"`
	Data            map[string]any    `json:"data,omitempty"`
	FieldTimestamps map[string]string `json:"fieldTimestamps,omitempty"`
	ClientID        string            `json:"clientId"`
	CreatedAt       string            `json:"createdAt"`
}

// HandleExport streams the authenticated user's full sync_changes log as
// JSONL. This is the M1 thin slice of the backup/restore feature — no zip,
// no manifest, no signature yet. Those land in M3.
//
// GDPR-bypass for billing: the route is wired outside the billing middleware
// in main.go, so users can always export their data even if their sync
// subscription is inactive.
func (h *Handler) HandleExport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.validator.UserIDFromRequest(r)
	if err != nil {
		http.Error(w, "unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	filename := fmt.Sprintf("mana-backup-%s-%s.jsonl", userID, time.Now().UTC().Format("20060102-150405"))

	w.Header().Set("Content-Type", "application/x-ndjson")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	// Disable proxy buffering so the response streams as rows arrive.
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("Cache-Control", "no-store")

	flusher, _ := w.(http.Flusher)
	encoder := json.NewEncoder(w)

	var count int
	streamErr := h.store.StreamAllUserChanges(r.Context(), userID, func(row store.ChangeRow) error {
		sv := row.SchemaVersion
		if sv <= 0 {
			sv = 1
		}
		line := exportLine{
			EventID:         row.ID,
			SchemaVersion:   sv,
			AppID:           row.AppID,
			Table:           row.TableName,
			RecordID:        row.RecordID,
			Op:              row.Op,
			Data:            row.Data,
			FieldTimestamps: row.FieldTimestamps,
			ClientID:        row.ClientID,
			CreatedAt:       row.CreatedAt.UTC().Format(time.RFC3339Nano),
		}
		if err := encoder.Encode(line); err != nil {
			return err
		}
		count++
		// Flush every ~500 rows so big exports show progress over the wire.
		if flusher != nil && count%500 == 0 {
			flusher.Flush()
		}
		return nil
	})
	if flusher != nil {
		flusher.Flush()
	}

	if streamErr != nil {
		// Headers are already sent, so we cannot change the status code.
		// Log and let the client detect truncation via the row count it expected.
		// (M3 will add a manifest with eventCount + sha256 for integrity checking.)
		slog.Error("backup export stream failed", "user_id", userID, "written", count, "error", streamErr)
		return
	}

	slog.Info("backup export ok", "user_id", userID, "rows", count)
}
