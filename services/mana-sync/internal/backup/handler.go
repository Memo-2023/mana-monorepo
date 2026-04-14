// Package backup implements the user-data backup endpoint.
//
// Streams a .mana archive (zip container) to the authenticated user containing:
//
//	events.jsonl  — one SyncChange per line, chronological
//	manifest.json — header with userId, counts, integrity hash, format version
//
// Design notes:
//
//   - The zip is built in a single DB pass. events.jsonl is written first
//     while the body is teed through a sha256 hasher; manifest.json lands as
//     a second zip entry after the stream closes, so the manifest can embed
//     the final eventsSha256 without a second scan.
//
//   - Ciphertext passes through untouched: fields encrypted by the client-
//     side registry remain AES-GCM ciphertext, so the archive is effectively
//     encrypted at rest for sensitive fields. Plaintext fields (IDs, sort
//     keys, timestamps) are visible in the archive — this matches the GDPR
//     data-portability expectation.
//
//   - The route is wired outside billingMiddleware in main.go so users can
//     always retrieve their data regardless of subscription status.
//
//   - Signature over manifest.json is deferred to phase 2; the eventsSha256
//     already catches accidental corruption during download/storage.
package backup

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/mana/mana-sync/internal/auth"
	"github.com/mana/mana-sync/internal/store"
)

// BackupFormatVersion is the container-format version (manifest.formatVersion).
// Distinct from syncproto.CurrentSchemaVersion — the container can change
// (signature added, different body encoding) without bumping every event.
const BackupFormatVersion = 1

// Handler serves GET /backup/export.
type Handler struct {
	store     *store.Store
	validator *auth.Validator
}

// NewHandler constructs a backup handler.
func NewHandler(s *store.Store, v *auth.Validator) *Handler {
	return &Handler{store: s, validator: v}
}

// exportLine is the on-wire shape of one row inside events.jsonl. Shared
// with writer.go so both the HTTP path and the writer tests serialize
// identically.
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

// manifestFile is the header object serialized as manifest.json.
type manifestFile struct {
	FormatVersion    int      `json:"formatVersion"`
	SchemaVersion    int      `json:"schemaVersion"`
	UserID           string   `json:"userId"`
	CreatedAt        string   `json:"createdAt"`
	EventCount       int      `json:"eventCount"`
	EventsSHA256     string   `json:"eventsSha256"`
	Apps             []string `json:"apps"`
	ProducedBy       string   `json:"producedBy"`
	SchemaVersionMin int      `json:"schemaVersionMin,omitempty"`
	SchemaVersionMax int      `json:"schemaVersionMax,omitempty"`
}

// HandleExport is an HTTP shim over WriteBackup: it authenticates, sets
// download headers, and hands the response writer plus a store-backed
// iterator to the shared writer. Tests talk to WriteBackup directly with
// a synthetic iterator.
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

	createdAt := time.Now().UTC()
	filename := fmt.Sprintf("mana-backup-%s-%s.mana", userID, createdAt.Format("20060102-150405"))

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("Cache-Control", "no-store")

	iter := storeIterator(r.Context(), h.store, userID)
	if err := WriteBackup(w, userID, createdAt, iter); err != nil {
		// Headers are flushed so we cannot downgrade to a 500 here; closing
		// the zip partial is the best we can do. The missing manifest is
		// itself a signal to the importer that the export was truncated.
		slog.Error("backup: write failed", "user_id", userID, "error", err)
		return
	}

	slog.Info("backup export ok", "user_id", userID)
}

// storeIterator adapts store.Store.StreamAllUserChanges to the RowIterator
// shape WriteBackup expects, holding the request context in the closure.
func storeIterator(ctx context.Context, s *store.Store, userID string) RowIterator {
	return func(fn func(store.ChangeRow) error) error {
		return s.StreamAllUserChanges(ctx, userID, fn)
	}
}
