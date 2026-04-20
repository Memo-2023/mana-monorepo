package sync

import (
	"testing"

	"github.com/mana/mana-sync/internal/store"
)

func TestExtractSpaceID_TopLevelWins(t *testing.T) {
	got := extractSpaceID(Change{
		SpaceID: "space-top",
		Data:    map[string]any{"spaceId": "space-data"},
		Fields:  map[string]*FieldChange{"spaceId": {Value: "space-field"}},
	})
	if got != "space-top" {
		t.Fatalf("want space-top, got %q", got)
	}
}

func TestExtractSpaceID_FallsBackToData(t *testing.T) {
	got := extractSpaceID(Change{
		Data: map[string]any{"spaceId": "space-from-data"},
	})
	if got != "space-from-data" {
		t.Fatalf("want space-from-data, got %q", got)
	}
}

func TestExtractSpaceID_FallsBackToFields(t *testing.T) {
	got := extractSpaceID(Change{
		Fields: map[string]*FieldChange{
			"spaceId": {Value: "space-from-fields"},
		},
	})
	if got != "space-from-fields" {
		t.Fatalf("want space-from-fields, got %q", got)
	}
}

func TestExtractSpaceID_EmptyWhenMissing(t *testing.T) {
	cases := []struct {
		name string
		c    Change
	}{
		{"nothing", Change{}},
		{"empty data", Change{Data: map[string]any{}}},
		{"data non-string", Change{Data: map[string]any{"spaceId": 42}}},
		{"fields non-string", Change{Fields: map[string]*FieldChange{"spaceId": {Value: nil}}}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := extractSpaceID(tc.c); got != "" {
				t.Fatalf("want empty, got %q", got)
			}
		})
	}
}

func TestChangeFromRow_PropagatesSpaceID(t *testing.T) {
	row := store.ChangeRow{
		ID:        "evt-1",
		TableName: "tasks",
		RecordID:  "task-1",
		Op:        "insert",
		SpaceID:   "org-edisconet",
	}
	got := changeFromRow(row)
	if got.SpaceID != "org-edisconet" {
		t.Fatalf("want space id to round-trip, got %q", got.SpaceID)
	}
}

func TestChangeFromRow_EmptySpaceIDStaysEmpty(t *testing.T) {
	row := store.ChangeRow{
		ID:        "evt-2",
		TableName: "tasks",
		RecordID:  "task-2",
		Op:        "insert",
	}
	got := changeFromRow(row)
	if got.SpaceID != "" {
		t.Fatalf("want empty space id, got %q", got.SpaceID)
	}
}
