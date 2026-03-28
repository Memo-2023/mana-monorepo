package search

import (
	"testing"
)

func TestBuildCacheKey(t *testing.T) {
	tests := []struct {
		name string
		req  SearchRequest
		want string
	}{
		{
			name: "simple query without options",
			req:  SearchRequest{Query: "hello world"},
			want: "search:hello world:::::0",
		},
		{
			name: "query is lowercased",
			req:  SearchRequest{Query: "Hello World"},
			want: "search:hello world:::::0",
		},
		{
			name: "with categories sorted",
			req: SearchRequest{
				Query:   "test",
				Options: &SearchOptions{Categories: []string{"science", "general"}},
			},
			want: "search:test:general,science::::0",
		},
		{
			name: "with engines sorted",
			req: SearchRequest{
				Query:   "test",
				Options: &SearchOptions{Engines: []string{"google", "bing", "duckduckgo"}},
			},
			want: "search:test::bing,duckduckgo,google:::0",
		},
		{
			name: "with language lowercased",
			req: SearchRequest{
				Query:   "test",
				Options: &SearchOptions{Language: "EN-US"},
			},
			want: "search:test:::en-us::0",
		},
		{
			name: "with all options",
			req: SearchRequest{
				Query: "Go lang",
				Options: &SearchOptions{
					Categories: []string{"it"},
					Engines:    []string{"github"},
					Language:   "de",
					TimeRange:  "month",
					SafeSearch: 1,
				},
			},
			want: "search:go lang:it:github:de:month:1",
		},
		{
			name: "does not mutate original slices",
			req: SearchRequest{
				Query:   "test",
				Options: &SearchOptions{Categories: []string{"z", "a"}},
			},
			want: "search:test:a,z::::0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// For the mutation test, keep a copy of original order
			var origCats []string
			if tt.req.Options != nil {
				origCats = make([]string, len(tt.req.Options.Categories))
				copy(origCats, tt.req.Options.Categories)
			}

			got := BuildCacheKey(&tt.req)
			if got != tt.want {
				t.Errorf("BuildCacheKey() = %q, want %q", got, tt.want)
			}

			// Verify original slice is not mutated
			if tt.req.Options != nil && len(origCats) > 0 {
				for i, v := range origCats {
					if tt.req.Options.Categories[i] != v {
						t.Errorf("BuildCacheKey mutated input categories: got %v", tt.req.Options.Categories)
					}
				}
			}
		})
	}
}

func TestScoreResult(t *testing.T) {
	tests := []struct {
		name    string
		result  searxngResult
		wantMin float64
		wantMax float64
	}{
		{
			name:    "base score for empty result",
			result:  searxngResult{URL: "https://example.com"},
			wantMin: 0.49,
			wantMax: 0.51,
		},
		{
			name:    "bonus for long content",
			result:  searxngResult{URL: "https://example.com", Content: string(make([]byte, 101))},
			wantMin: 0.59,
			wantMax: 0.61,
		},
		{
			name:    "bonus for trusted domain wikipedia",
			result:  searxngResult{URL: "https://en.wikipedia.org/wiki/Go"},
			wantMin: 0.64,
			wantMax: 0.66,
		},
		{
			name:    "bonus for trusted domain github",
			result:  searxngResult{URL: "https://github.com/golang/go"},
			wantMin: 0.64,
			wantMax: 0.66,
		},
		{
			name:    "bonus for trusted domain stackoverflow",
			result:  searxngResult{URL: "https://stackoverflow.com/questions/123"},
			wantMin: 0.64,
			wantMax: 0.66,
		},
		{
			name:    "penalty for long URL",
			result:  searxngResult{URL: "https://example.com/" + string(make([]byte, 200))},
			wantMin: 0.44,
			wantMax: 0.46,
		},
		{
			name: "combined bonuses: trusted domain + long content",
			result: searxngResult{
				URL:     "https://en.wikipedia.org/wiki/Go",
				Content: string(make([]byte, 150)),
			},
			wantMin: 0.74,
			wantMax: 0.76,
		},
		{
			name:    "score clamped to 0 minimum",
			result:  searxngResult{URL: ":::invalid"},
			wantMin: 0.0,
			wantMax: 1.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := scoreResult(tt.result)
			if got < tt.wantMin || got > tt.wantMax {
				t.Errorf("scoreResult() = %f, want between %f and %f", got, tt.wantMin, tt.wantMax)
			}
		})
	}
}

func TestNormalizeResults(t *testing.T) {
	t.Run("deduplicates by URL", func(t *testing.T) {
		raw := []searxngResult{
			{URL: "https://a.com", Title: "A", Engine: "google"},
			{URL: "https://a.com", Title: "A dup", Engine: "bing"},
			{URL: "https://b.com", Title: "B", Engine: "google"},
		}
		results := normalizeResults(raw, nil)
		if len(results) != 2 {
			t.Fatalf("expected 2 results, got %d", len(results))
		}
		// First occurrence should be kept
		if results[0].Title == "A dup" || results[1].Title == "A dup" {
			t.Error("duplicate should have been removed")
		}
	})

	t.Run("default limit is 10", func(t *testing.T) {
		raw := make([]searxngResult, 15)
		for i := range raw {
			raw[i] = searxngResult{URL: "https://example.com/" + string(rune('a'+i)), Title: "T"}
		}
		results := normalizeResults(raw, nil)
		if len(results) != 10 {
			t.Errorf("expected 10 results (default limit), got %d", len(results))
		}
	})

	t.Run("custom limit", func(t *testing.T) {
		raw := make([]searxngResult, 15)
		for i := range raw {
			raw[i] = searxngResult{URL: "https://example.com/" + string(rune('a'+i)), Title: "T"}
		}
		opts := &SearchOptions{Limit: 5}
		results := normalizeResults(raw, opts)
		if len(results) != 5 {
			t.Errorf("expected 5 results, got %d", len(results))
		}
	})

	t.Run("limit over 50 uses default", func(t *testing.T) {
		raw := make([]searxngResult, 15)
		for i := range raw {
			raw[i] = searxngResult{URL: "https://example.com/" + string(rune('a'+i)), Title: "T"}
		}
		opts := &SearchOptions{Limit: 100}
		results := normalizeResults(raw, opts)
		if len(results) != 10 {
			t.Errorf("expected 10 results (limit>50 falls back to default), got %d", len(results))
		}
	})

	t.Run("sorted by score descending", func(t *testing.T) {
		raw := []searxngResult{
			{URL: "https://example.com/short", Title: "Short", Content: "x"},
			{URL: "https://en.wikipedia.org/wiki/Go", Title: "Wiki", Content: string(make([]byte, 150))},
		}
		results := normalizeResults(raw, nil)
		if len(results) < 2 {
			t.Fatal("expected at least 2 results")
		}
		if results[0].Score < results[1].Score {
			t.Errorf("results not sorted by score: %f < %f", results[0].Score, results[1].Score)
		}
	})

	t.Run("empty input returns nil", func(t *testing.T) {
		results := normalizeResults(nil, nil)
		if results != nil {
			t.Errorf("expected nil for empty input, got %v", results)
		}
	})
}

func TestCacheOptionsIsEnabled(t *testing.T) {
	tests := []struct {
		name string
		opts *CacheOptions
		want bool
	}{
		{"nil cache options", nil, true},
		{"nil enabled field", &CacheOptions{}, true},
		{"enabled true", &CacheOptions{Enabled: boolPtr(true)}, true},
		{"enabled false", &CacheOptions{Enabled: boolPtr(false)}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.opts.IsEnabled(); got != tt.want {
				t.Errorf("IsEnabled() = %v, want %v", got, tt.want)
			}
		})
	}
}

func boolPtr(b bool) *bool {
	return &b
}
