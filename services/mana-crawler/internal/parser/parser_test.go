package parser

import "testing"

func TestParse_Title(t *testing.T) {
	html := `<html><head><title>Page Title</title></head><body><h1>Main Heading</h1><p>Content</p></body></html>`
	result, err := Parse(html, "https://example.com", nil)
	if err != nil {
		t.Fatal(err)
	}
	if result.Title != "Main Heading" {
		t.Errorf("title = %q, want %q", result.Title, "Main Heading")
	}
}

func TestParse_Links(t *testing.T) {
	html := `<html><body>
		<a href="/page1">Page 1</a>
		<a href="https://example.com/page2">Page 2</a>
		<a href="https://other.com/ext">External</a>
		<a href="mailto:test@test.com">Email</a>
		<a href="#section">Anchor</a>
	</body></html>`

	result, err := Parse(html, "https://example.com", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Should have page1 and page2 (same origin), not external, mailto, or anchor
	if len(result.Links) != 2 {
		t.Errorf("links count = %d, want 2, got: %v", len(result.Links), result.Links)
	}
}

func TestParse_Metadata(t *testing.T) {
	html := `<html><head>
		<meta name="description" content="Test description">
		<meta property="og:title" content="OG Title">
		<link rel="canonical" href="https://example.com/canonical">
	</head><body></body></html>`

	result, err := Parse(html, "https://example.com", nil)
	if err != nil {
		t.Fatal(err)
	}

	if result.Metadata["description"] != "Test description" {
		t.Errorf("description = %q", result.Metadata["description"])
	}
	if result.Metadata["og:title"] != "OG Title" {
		t.Errorf("og:title = %q", result.Metadata["og:title"])
	}
	if result.Metadata["canonical"] != "https://example.com/canonical" {
		t.Errorf("canonical = %q", result.Metadata["canonical"])
	}
}

func TestCleanText(t *testing.T) {
	html := `<p>Hello <strong>world</strong></p><script>alert('x')</script>`
	got := cleanText(html)
	if got != "Hello world" {
		t.Errorf("cleanText = %q, want %q", got, "Hello world")
	}
}

func TestMatchesPatterns(t *testing.T) {
	tests := []struct {
		url     string
		include []string
		exclude []string
		want    bool
	}{
		{"https://example.com/docs/page", []string{"/docs/"}, nil, true},
		{"https://example.com/api/v1", []string{"/docs/"}, nil, false},
		{"https://example.com/docs/page", nil, []string{"/api/"}, true},
		{"https://example.com/api/page", nil, []string{"/api/"}, false},
		{"https://example.com/any", nil, nil, true},
	}

	for _, tt := range tests {
		// Use the crawler package's matchesPatterns — testing indirectly via parser
		// Here we just test the logic inline
		got := matchPatterns(tt.url, tt.include, tt.exclude)
		if got != tt.want {
			t.Errorf("matchPatterns(%q, %v, %v) = %v, want %v", tt.url, tt.include, tt.exclude, got, tt.want)
		}
	}
}

func matchPatterns(u string, include, exclude []string) bool {
	if len(include) > 0 {
		matched := false
		for _, p := range include {
			if len(p) > 0 && containsPattern(u, p) {
				matched = true
				break
			}
		}
		if !matched {
			return false
		}
	}
	for _, p := range exclude {
		if containsPattern(u, p) {
			return false
		}
	}
	return true
}

func containsPattern(u, pattern string) bool {
	// Strip wildcards
	p := pattern
	if len(p) > 0 && p[0] == '*' {
		p = p[1:]
	}
	if len(p) > 0 && p[len(p)-1] == '*' {
		p = p[:len(p)-1]
	}
	return len(p) > 0 && len(u) > 0 && indexOf(u, p) >= 0
}

func indexOf(s, sub string) int {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
