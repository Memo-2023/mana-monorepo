package matrix

import "testing"

func TestMarkdownToHTML(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"**bold**", "<strong>bold</strong>"},
		{"*italic*", "<em>italic</em>"},
		{"~~strike~~", "<del>strike</del>"},
		{"`code`", "<code>code</code>"},
		{"line1\nline2", "line1<br>line2"},
		{"**bold** and *italic*", "<strong>bold</strong> and <em>italic</em>"},
		{"plain text", "plain text"},
		{"", ""},
	}

	for _, tt := range tests {
		got := MarkdownToHTML(tt.input)
		if got != tt.want {
			t.Errorf("MarkdownToHTML(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestEscapeHTML(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"<script>", "&lt;script&gt;"},
		{`"quotes"`, "&quot;quotes&quot;"},
		{"a & b", "a &amp; b"},
		{"it's", "it&#039;s"},
		{"plain", "plain"},
	}

	for _, tt := range tests {
		got := EscapeHTML(tt.input)
		if got != tt.want {
			t.Errorf("EscapeHTML(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestFormatNumberedList(t *testing.T) {
	items := []string{"Apple", "Banana", "Cherry"}
	got := FormatNumberedList(items, func(s string, i int) string { return s })
	want := "1. Apple\n2. Banana\n3. Cherry"
	if got != want {
		t.Errorf("FormatNumberedList = %q, want %q", got, want)
	}
}

func TestFormatBulletList(t *testing.T) {
	items := []string{"Apple", "Banana"}
	got := FormatBulletList(items, func(s string) string { return s })
	want := "• Apple\n• Banana"
	if got != want {
		t.Errorf("FormatBulletList = %q, want %q", got, want)
	}
}
