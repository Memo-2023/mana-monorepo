package extract

import (
	"testing"
	"time"
)

func TestCleanText(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "plain text unchanged",
			input: "Hello world",
			want:  "Hello world",
		},
		{
			name:  "strips HTML tags",
			input: "<p>Hello <strong>world</strong></p>",
			want:  "Hello world",
		},
		{
			name:  "strips script tags and content",
			input: "Before<script>alert('xss')</script>After",
			want:  "BeforeAfter",
		},
		{
			name:  "strips style tags and content",
			input: "Before<style>.a{color:red}</style>After",
			want:  "BeforeAfter",
		},
		{
			name:  "collapses whitespace",
			input: "Hello   \n\t  world",
			want:  "Hello world",
		},
		{
			name:  "trims leading and trailing whitespace",
			input: "   Hello world   ",
			want:  "Hello world",
		},
		{
			name:  "handles multiline script",
			input: "A<script type=\"text/javascript\">\nvar x = 1;\nconsole.log(x);\n</script>B",
			want:  "AB",
		},
		{
			name:  "empty string",
			input: "",
			want:  "",
		},
		{
			name:  "only tags",
			input: "<div><span></span></div>",
			want:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cleanText(tt.input)
			if got != tt.want {
				t.Errorf("cleanText() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestCountWords(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  int
	}{
		{"empty string", "", 0},
		{"single word", "hello", 1},
		{"multiple words", "hello world foo bar", 4},
		{"extra whitespace", "  hello   world  ", 2},
		{"tabs and newlines", "hello\tworld\nfoo", 3},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := countWords(tt.input)
			if got != tt.want {
				t.Errorf("countWords() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestFormatTime(t *testing.T) {
	tests := []struct {
		name string
		t    *time.Time
		want string
	}{
		{"nil time", nil, ""},
		{"zero time", func() *time.Time { t := time.Time{}; return &t }(), ""},
		{
			"valid time",
			func() *time.Time {
				t := time.Date(2024, 6, 15, 12, 30, 0, 0, time.UTC)
				return &t
			}(),
			"2024-06-15T12:30:00Z",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t2 *testing.T) {
			got := formatTime(tt.t)
			if got != tt.want {
				t2.Errorf("formatTime() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestBuildCacheKey(t *testing.T) {
	tests := []struct {
		name string
		url  string
		want string
	}{
		{"simple URL", "https://example.com", "extract:https://example.com"},
		{"URL with path", "https://example.com/path/to/page", "extract:https://example.com/path/to/page"},
		{"empty string", "", "extract:"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := BuildCacheKey(tt.url)
			if got != tt.want {
				t.Errorf("BuildCacheKey() = %q, want %q", got, tt.want)
			}
		})
	}
}
