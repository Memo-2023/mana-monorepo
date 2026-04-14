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
	"archive/zip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sort"
	"time"

	"github.com/mana/mana-sync/internal/auth"
	syncproto "github.com/mana/mana-sync/internal/sync"
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

// exportLine is the on-wire shape of one row inside events.jsonl. Field
// names mirror the sync-protocol Change shape so the restore side can feed
// lines straight into applyServerChanges() after running them through the
// migration chain keyed on schemaVersion.
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

// manifestFile is the header object serialized as manifest.json. Kept small
// and declarative so tools can parse it without loading events.jsonl.
type manifestFile struct {
	FormatVersion    int      `json:"formatVersion"`
	SchemaVersion    int      `json:"schemaVersion"` // max event schemaVersion this server knows
	UserID           string   `json:"userId"`
	CreatedAt        string   `json:"createdAt"`
	EventCount       int      `json:"eventCount"`
	EventsSHA256     string   `json:"eventsSha256"`
	Apps             []string `json:"apps"`
	ProducedBy       string   `json:"producedBy"`
	SchemaVersionMin int      `json:"schemaVersionMin,omitempty"`
	SchemaVersionMax int      `json:"schemaVersionMax,omitempty"`
}

// HandleExport streams a .mana zip archive containing the user's full
// sync-event log plus a manifest with integrity hash.
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

	zw := zip.NewWriter(w)
	// Only close once — closing writes the central directory, which we need
	// even if streaming errored partway so the file is at least a valid zip.
	zipClosed := false
	closeZip := func() {
		if zipClosed {
			return
		}
		zipClosed = true
		if err := zw.Close(); err != nil {
			slog.Error("backup: zip close failed", "user_id", userID, "error", err)
		}
	}
	defer closeZip()

	// ─── events.jsonl entry ──────────────────────────────────────
	eventsWriter, err := zw.CreateHeader(&zip.FileHeader{
		Name:     "events.jsonl",
		Method:   zip.Deflate,
		Modified: createdAt,
	})
	if err != nil {
		slog.Error("backup: create events.jsonl entry", "user_id", userID, "error", err)
		return
	}

	hasher := sha256.New()
	// Tee so the deflate entry and the hash both see every byte — the hash
	// is over the *decompressed* JSONL, which is what the restore side will
	// re-hash after unzipping.
	teed := io.MultiWriter(eventsWriter, hasher)
	encoder := json.NewEncoder(teed)

	var (
		count      int
		appSet     = make(map[string]struct{})
		minVer     int
		maxVer     int
	)

	streamErr := h.store.StreamAllUserChanges(r.Context(), userID, func(row store.ChangeRow) error {
		sv := row.SchemaVersion
		if sv <= 0 {
			sv = 1
		}
		if count == 0 {
			minVer = sv
			maxVer = sv
		} else {
			if sv < minVer {
				minVer = sv
			}
			if sv > maxVer {
				maxVer = sv
			}
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
		appSet[row.AppID] = struct{}{}
		count++
		return nil
	})
	if streamErr != nil {
		slog.Error("backup: stream failed", "user_id", userID, "written", count, "error", streamErr)
		// Headers are flushed; best we can do is close the zip so the file
		// isn't corrupt. The manifest won't land, and the absence of it is
		// itself a signal to the importer that the export was truncated.
		return
	}

	// ─── manifest.json entry ─────────────────────────────────────
	apps := make([]string, 0, len(appSet))
	for a := range appSet {
		apps = append(apps, a)
	}
	sort.Strings(apps)

	manifest := manifestFile{
		FormatVersion:    BackupFormatVersion,
		SchemaVersion:    syncproto.CurrentSchemaVersion,
		UserID:           userID,
		CreatedAt:        createdAt.Format(time.RFC3339Nano),
		EventCount:       count,
		EventsSHA256:     hex.EncodeToString(hasher.Sum(nil)),
		Apps:             apps,
		ProducedBy:       "mana-sync",
		SchemaVersionMin: minVer,
		SchemaVersionMax: maxVer,
	}
	manifestBytes, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		slog.Error("backup: marshal manifest", "user_id", userID, "error", err)
		return
	}
	manifestWriter, err := zw.CreateHeader(&zip.FileHeader{
		Name:     "manifest.json",
		Method:   zip.Deflate,
		Modified: createdAt,
	})
	if err != nil {
		slog.Error("backup: create manifest entry", "user_id", userID, "error", err)
		return
	}
	if _, err := manifestWriter.Write(manifestBytes); err != nil {
		slog.Error("backup: write manifest", "user_id", userID, "error", err)
		return
	}

	closeZip()
	slog.Info("backup export ok",
		"user_id", userID,
		"rows", count,
		"apps", len(apps),
		"schema_min", minVer,
		"schema_max", maxVer,
	)
}
