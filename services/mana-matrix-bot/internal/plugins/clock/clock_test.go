package clock

import "testing"

func TestParseDuration(t *testing.T) {
	tests := []struct {
		input string
		want  int // seconds
	}{
		{"25m", 25 * 60},
		{"25", 25 * 60},
		{"1h", 3600},
		{"1h30m", 5400},
		{"2h", 7200},
		{"90", 90 * 60},
		{"1h0m", 3600},
		{"0", 0},
		{"abc", 0},
		{"", 0},
	}

	for _, tt := range tests {
		got := parseDuration(tt.input)
		if got != tt.want {
			t.Errorf("parseDuration(%q) = %d, want %d", tt.input, got, tt.want)
		}
	}
}

func TestParseAlarmTime(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"07:30", "07:30"},
		{"7:30", "7:30"},
		{"14:00", "14:00"},
		{"7 uhr 30", "7:30"},
		{"7 30", "7:30"},
		{"7", "7:00"},
		{"abc", ""},
	}

	for _, tt := range tests {
		got := parseAlarmTime(tt.input)
		if got != tt.want {
			t.Errorf("parseAlarmTime(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		seconds int
		want    string
	}{
		{0, "0:00"},
		{65, "1:05"},
		{3600, "1:00:00"},
		{3661, "1:01:01"},
		{1500, "25:00"},
		{-5, "0:00"},
	}

	for _, tt := range tests {
		got := formatDuration(tt.seconds)
		if got != tt.want {
			t.Errorf("formatDuration(%d) = %q, want %q", tt.seconds, got, tt.want)
		}
	}
}
