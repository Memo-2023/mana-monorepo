package plugin

import "testing"

func TestKeywordDetector_Detect(t *testing.T) {
	detector := NewKeywordDetector([]KeywordCommand{
		{Keywords: []string{"hilfe", "help"}, Command: "help"},
		{Keywords: []string{"zeige aufgaben", "show tasks"}, Command: "list"},
		{Keywords: []string{"status"}, Command: "status"},
	})

	tests := []struct {
		input string
		want  string
	}{
		{"hilfe", "help"},
		{"Hilfe", "help"},
		{"HILFE", "help"},
		{"hilfe bitte", "help"},
		{"help", "help"},
		{"zeige aufgaben", "list"},
		{"show tasks", "list"},
		{"status", "status"},
		{"status info", "status"},
		{"was ist los", ""},
		{"", ""},
		// Long message should be skipped
		{string(make([]byte, 100)), ""},
	}

	for _, tt := range tests {
		got := detector.Detect(tt.input)
		if got != tt.want {
			t.Errorf("Detect(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestKeywordDetector_PartialMatch(t *testing.T) {
	detector := NewKeywordDetector(
		[]KeywordCommand{
			{Keywords: []string{"aufgabe"}, Command: "task"},
		},
		WithPartialMatch(true),
	)

	tests := []struct {
		input string
		want  string
	}{
		{"neue aufgabe erstellen", "task"},
		{"aufgabe", "task"},
		{"nix", ""},
	}

	for _, tt := range tests {
		got := detector.Detect(tt.input)
		if got != tt.want {
			t.Errorf("Detect(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestKeywordDetector_MaxLength(t *testing.T) {
	detector := NewKeywordDetector(
		[]KeywordCommand{
			{Keywords: []string{"help"}, Command: "help"},
		},
		WithMaxLength(10),
	)

	if got := detector.Detect("help"); got != "help" {
		t.Errorf("short message should match, got %q", got)
	}
	if got := detector.Detect("help me please now"); got != "" {
		t.Errorf("long message should be skipped, got %q", got)
	}
}
