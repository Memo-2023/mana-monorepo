package backup

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"strings"
	"testing"
	"time"

	"github.com/mana/mana-sync/internal/store"
)

// rowsIterator returns a RowIterator that walks a fixed slice of rows.
// Used in place of the Postgres store so tests exercise the writer
// end-to-end without a live DB.
func rowsIterator(rows []store.ChangeRow) RowIterator {
	return func(fn func(store.ChangeRow) error) error {
		for _, r := range rows {
			if err := fn(r); err != nil {
				return err
			}
		}
		return nil
	}
}

func sampleRows() []store.ChangeRow {
	ts := func(s string) time.Time {
		t, err := time.Parse(time.RFC3339Nano, s)
		if err != nil {
			panic(err)
		}
		return t
	}
	return []store.ChangeRow{
		{
			ID:            "evt-1",
			AppID:         "todo",
			TableName:     "tasks",
			RecordID:      "task-1",
			Op:            "insert",
			Data:          map[string]any{"title": "Buy milk"},
			ClientID:      "client-a",
			CreatedAt:     ts("2026-04-14T10:00:00.000Z"),
			SchemaVersion: 1,
		},
		{
			ID:              "evt-2",
			AppID:           "todo",
			TableName:       "tasks",
			RecordID:        "task-1",
			Op:              "update",
			Data:            map[string]any{"completed": true},
			FieldTimestamps: map[string]string{"completed": "2026-04-14T10:05:00.000Z"},
			ClientID:        "client-a",
			CreatedAt:       ts("2026-04-14T10:05:00.000Z"),
			SchemaVersion:   1,
		},
		{
			ID:            "evt-3",
			AppID:         "calendar",
			TableName:     "events",
			RecordID:      "evt-42",
			Op:            "insert",
			Data:          map[string]any{"title": "Meeting"},
			ClientID:      "client-b",
			CreatedAt:     ts("2026-04-14T11:00:00.000Z"),
			SchemaVersion: 1,
		},
	}
}

func TestWriteBackup_Roundtrip(t *testing.T) {
	var buf bytes.Buffer
	createdAt := time.Date(2026, 4, 14, 12, 0, 0, 0, time.UTC)

	if err := WriteBackup(&buf, "user-123", createdAt, rowsIterator(sampleRows())); err != nil {
		t.Fatalf("WriteBackup: %v", err)
	}

	// Archive must parse as a valid zip with exactly two entries.
	zr, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		t.Fatalf("zip.NewReader: %v", err)
	}
	if len(zr.File) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(zr.File))
	}

	events := readZipEntry(t, zr, "events.jsonl")
	manifestBytes := readZipEntry(t, zr, "manifest.json")

	// events.jsonl: three newline-separated JSON records in input order.
	lines := strings.Split(strings.TrimRight(string(events), "\n"), "\n")
	if len(lines) != 3 {
		t.Fatalf("expected 3 events, got %d", len(lines))
	}

	// Event 1 is insert with data, no fieldTimestamps.
	var e1 map[string]any
	if err := json.Unmarshal([]byte(lines[0]), &e1); err != nil {
		t.Fatalf("parse line 0: %v", err)
	}
	if e1["op"] != "insert" || e1["eventId"] != "evt-1" || e1["appId"] != "todo" {
		t.Fatalf("event 0 unexpected: %#v", e1)
	}
	if _, ok := e1["fieldTimestamps"]; ok {
		t.Fatalf("event 0 should omit fieldTimestamps (insert)")
	}

	// Event 2 is update with fieldTimestamps surfaced.
	var e2 map[string]any
	if err := json.Unmarshal([]byte(lines[1]), &e2); err != nil {
		t.Fatalf("parse line 1: %v", err)
	}
	ft, ok := e2["fieldTimestamps"].(map[string]any)
	if !ok {
		t.Fatalf("event 1 fieldTimestamps missing")
	}
	if ft["completed"] != "2026-04-14T10:05:00.000Z" {
		t.Fatalf("event 1 fieldTimestamps wrong: %#v", ft)
	}

	// Manifest: all declared fields match what we wrote.
	var m manifestFile
	if err := json.Unmarshal(manifestBytes, &m); err != nil {
		t.Fatalf("parse manifest: %v", err)
	}
	if m.FormatVersion != BackupFormatVersion {
		t.Fatalf("formatVersion=%d want %d", m.FormatVersion, BackupFormatVersion)
	}
	if m.UserID != "user-123" {
		t.Fatalf("userId=%q want user-123", m.UserID)
	}
	if m.EventCount != 3 {
		t.Fatalf("eventCount=%d want 3", m.EventCount)
	}
	if m.SchemaVersionMin != 1 || m.SchemaVersionMax != 1 {
		t.Fatalf("schemaVersion range=[%d,%d] want [1,1]", m.SchemaVersionMin, m.SchemaVersionMax)
	}
	if len(m.Apps) != 2 || m.Apps[0] != "calendar" || m.Apps[1] != "todo" {
		t.Fatalf("apps=%v want sorted [calendar todo]", m.Apps)
	}
	if m.ProducedBy != "mana-sync" {
		t.Fatalf("producedBy=%q want mana-sync", m.ProducedBy)
	}

	// eventsSha256 must match a fresh SHA of the decompressed events body.
	h := sha256.New()
	h.Write(events)
	want := hex.EncodeToString(h.Sum(nil))
	if m.EventsSHA256 != want {
		t.Fatalf("eventsSha256 mismatch: manifest=%s recomputed=%s", m.EventsSHA256, want)
	}
}

func TestWriteBackup_EmptyUser(t *testing.T) {
	var buf bytes.Buffer
	err := WriteBackup(&buf, "", time.Now(), rowsIterator(nil))
	if err == nil {
		t.Fatal("expected error for empty userID")
	}
	if !strings.Contains(err.Error(), "empty userID") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestWriteBackup_NoRows(t *testing.T) {
	var buf bytes.Buffer
	createdAt := time.Date(2026, 4, 14, 12, 0, 0, 0, time.UTC)

	if err := WriteBackup(&buf, "user-x", createdAt, rowsIterator(nil)); err != nil {
		t.Fatalf("WriteBackup: %v", err)
	}

	zr, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		t.Fatalf("zip.NewReader: %v", err)
	}

	events := readZipEntry(t, zr, "events.jsonl")
	if len(events) != 0 {
		t.Fatalf("expected empty events.jsonl, got %d bytes", len(events))
	}

	manifestBytes := readZipEntry(t, zr, "manifest.json")
	var m manifestFile
	if err := json.Unmarshal(manifestBytes, &m); err != nil {
		t.Fatalf("parse manifest: %v", err)
	}
	if m.EventCount != 0 {
		t.Fatalf("eventCount=%d want 0", m.EventCount)
	}
	if len(m.Apps) != 0 {
		t.Fatalf("apps=%v want empty", m.Apps)
	}
	// Empty body still needs a valid sha.
	if m.EventsSHA256 == "" {
		t.Fatal("eventsSha256 empty even for zero-row export")
	}
}

func TestWriteBackup_DefaultsSchemaVersionZeroRowsToOne(t *testing.T) {
	// Legacy rows stored before the schema_version column existed scan as
	// 0. The writer must clamp them to 1 so the manifest's
	// schemaVersionMin/Max never claims a nonexistent protocol version.
	rows := []store.ChangeRow{{
		ID: "e1", AppID: "todo", TableName: "tasks", RecordID: "t1",
		Op: "insert", Data: map[string]any{"x": 1}, ClientID: "c",
		CreatedAt: time.Now(), SchemaVersion: 0,
	}}
	var buf bytes.Buffer
	if err := WriteBackup(&buf, "u", time.Now(), rowsIterator(rows)); err != nil {
		t.Fatalf("WriteBackup: %v", err)
	}
	zr, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		t.Fatalf("zip.NewReader: %v", err)
	}
	events := readZipEntry(t, zr, "events.jsonl")
	if !strings.Contains(string(events), `"schemaVersion":1`) {
		t.Fatalf("expected schemaVersion:1 in events body, got: %s", events)
	}
}

// readZipEntry reads the named entry out of a zip archive in full. Fails
// the test if the entry is missing or cannot be decompressed.
func readZipEntry(t *testing.T, zr *zip.Reader, name string) []byte {
	t.Helper()
	for _, f := range zr.File {
		if f.Name != name {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			t.Fatalf("open %s: %v", name, err)
		}
		defer rc.Close()
		body, err := io.ReadAll(rc)
		if err != nil {
			t.Fatalf("read %s: %v", name, err)
		}
		return body
	}
	t.Fatalf("entry %q not found in zip", name)
	return nil
}
