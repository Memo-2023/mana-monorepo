package backup

import (
	"archive/zip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"sort"
	"time"

	syncproto "github.com/mana/mana-sync/internal/sync"
	"github.com/mana/mana-sync/internal/store"
)

// RowIterator yields every sync_changes row that belongs in a backup,
// invoking fn for each. The HTTP handler wires this to
// store.StreamAllUserChanges; tests wire it to an in-memory slice so the
// zip writer can be exercised without Postgres.
type RowIterator func(fn func(store.ChangeRow) error) error

// WriteBackup serializes the user's sync_changes as a .mana zip archive
// into dst. This is the integration point with io.Writer so both the HTTP
// streaming path and tests share the same byte-for-byte production code.
//
// Single pass: events.jsonl is written first while sha256 tees through the
// encoder; manifest.json lands as a second zip entry with the final hash.
//
// The function returns after closing the zip's central directory, so dst
// contains a fully valid archive by the time err == nil.
func WriteBackup(dst io.Writer, userID string, createdAt time.Time, iter RowIterator) error {
	if userID == "" {
		return fmt.Errorf("backup: empty userID")
	}

	zw := zip.NewWriter(dst)
	defer zw.Close()

	eventsWriter, err := zw.CreateHeader(&zip.FileHeader{
		Name:     "events.jsonl",
		Method:   zip.Deflate,
		Modified: createdAt,
	})
	if err != nil {
		return fmt.Errorf("backup: create events.jsonl entry: %w", err)
	}

	hasher := sha256.New()
	teed := io.MultiWriter(eventsWriter, hasher)
	encoder := json.NewEncoder(teed)

	var (
		count  int
		appSet = make(map[string]struct{})
		minVer int
		maxVer int
	)

	if err := iter(func(row store.ChangeRow) error {
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
	}); err != nil {
		return fmt.Errorf("backup: iterate rows: %w", err)
	}

	apps := make([]string, 0, len(appSet))
	for a := range appSet {
		apps = append(apps, a)
	}
	sort.Strings(apps)

	manifest := manifestFile{
		FormatVersion:    BackupFormatVersion,
		SchemaVersion:    syncproto.CurrentSchemaVersion,
		UserID:           userID,
		CreatedAt:        createdAt.UTC().Format(time.RFC3339Nano),
		EventCount:       count,
		EventsSHA256:     hex.EncodeToString(hasher.Sum(nil)),
		Apps:             apps,
		ProducedBy:       "mana-sync",
		SchemaVersionMin: minVer,
		SchemaVersionMax: maxVer,
	}
	manifestBytes, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return fmt.Errorf("backup: marshal manifest: %w", err)
	}
	manifestWriter, err := zw.CreateHeader(&zip.FileHeader{
		Name:     "manifest.json",
		Method:   zip.Deflate,
		Modified: createdAt,
	})
	if err != nil {
		return fmt.Errorf("backup: create manifest entry: %w", err)
	}
	if _, err := manifestWriter.Write(manifestBytes); err != nil {
		return fmt.Errorf("backup: write manifest: %w", err)
	}

	return zw.Close()
}
