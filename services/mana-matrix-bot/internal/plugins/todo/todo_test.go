package todo

import (
	"testing"
	"time"
)

func TestParseTaskInput(t *testing.T) {
	tests := []struct {
		input    string
		title    string
		priority int
		hasDate  bool
		project  string
	}{
		{"Einkaufen", "Einkaufen", 4, false, ""},
		{"Einkaufen !p1", "Einkaufen", 1, false, ""},
		{"Einkaufen !p2 @morgen", "Einkaufen", 2, true, ""},
		{"Einkaufen !p1 @morgen #haushalt", "Einkaufen", 1, true, "haushalt"},
		{"Meeting vorbereiten #arbeit", "Meeting vorbereiten", 4, false, "arbeit"},
		{"  Spaces  !p3  ", "Spaces", 3, false, ""},
	}

	for _, tt := range tests {
		title, priority, dueDate, project := parseTaskInput(tt.input)
		if title != tt.title {
			t.Errorf("parseTaskInput(%q) title = %q, want %q", tt.input, title, tt.title)
		}
		if priority != tt.priority {
			t.Errorf("parseTaskInput(%q) priority = %d, want %d", tt.input, priority, tt.priority)
		}
		if tt.hasDate && dueDate == nil {
			t.Errorf("parseTaskInput(%q) expected dueDate, got nil", tt.input)
		}
		if !tt.hasDate && dueDate != nil {
			t.Errorf("parseTaskInput(%q) expected no dueDate, got %q", tt.input, *dueDate)
		}
		if project != tt.project {
			t.Errorf("parseTaskInput(%q) project = %q, want %q", tt.input, project, tt.project)
		}
	}
}

func TestParseGermanDate(t *testing.T) {
	today := time.Now().Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	tests := []struct {
		input string
		want  string
	}{
		{"heute", today},
		{"today", today},
		{"morgen", tomorrow},
		{"tomorrow", tomorrow},
		{"2025-03-27", "2025-03-27"},
		{"ungültig", ""},
	}

	for _, tt := range tests {
		got := parseGermanDate(tt.input)
		if got != tt.want {
			t.Errorf("parseGermanDate(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestFormatDate(t *testing.T) {
	today := time.Now().Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	tests := []struct {
		input string
		want  string
	}{
		{today, "Heute"},
		{tomorrow, "Morgen"},
		{"2025-12-25", "25.12"},
	}

	for _, tt := range tests {
		got := formatDate(tt.input)
		if got != tt.want {
			t.Errorf("formatDate(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}
