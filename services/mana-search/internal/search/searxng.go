package search

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/mana/mana-search/internal/config"
)

// SearXNG provider handles communication with the SearXNG meta-search engine.
type SearxngProvider struct {
	baseURL string
	timeout time.Duration
	client  *http.Client
}

func NewSearxngProvider(cfg *config.Config) *SearxngProvider {
	timeout := time.Duration(cfg.SearxngTimeout) * time.Millisecond
	return &SearxngProvider{
		baseURL: cfg.SearxngURL,
		timeout: timeout,
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

// SearchRequest represents the incoming search request.
type SearchRequest struct {
	Query   string         `json:"query"`
	Options *SearchOptions `json:"options,omitempty"`
	Cache   *CacheOptions  `json:"cache,omitempty"`
}

type SearchOptions struct {
	Categories []string `json:"categories,omitempty"`
	Engines    []string `json:"engines,omitempty"`
	Language   string   `json:"language,omitempty"`
	TimeRange  string   `json:"timeRange,omitempty"`
	SafeSearch int      `json:"safeSearch,omitempty"`
	Limit      int      `json:"limit,omitempty"`
}

type CacheOptions struct {
	Enabled *bool `json:"enabled,omitempty"`
	TTL     int   `json:"ttl,omitempty"`
}

func (c *CacheOptions) IsEnabled() bool {
	if c == nil || c.Enabled == nil {
		return true
	}
	return *c.Enabled
}

// SearchResponse is returned to the client.
type SearchResponse struct {
	Results []SearchResult `json:"results"`
	Meta    SearchMeta     `json:"meta"`
}

type SearchResult struct {
	URL           string  `json:"url"`
	Title         string  `json:"title"`
	Snippet       string  `json:"snippet"`
	Engine        string  `json:"engine"`
	Score         float64 `json:"score"`
	PublishedDate string  `json:"publishedDate,omitempty"`
	Thumbnail     string  `json:"thumbnail,omitempty"`
	Category      string  `json:"category"`
}

type SearchMeta struct {
	Query        string   `json:"query"`
	TotalResults int      `json:"totalResults"`
	Engines      []string `json:"engines"`
	Duration     int64    `json:"duration"`
	Cached       bool     `json:"cached"`
	CacheKey     string   `json:"cacheKey,omitempty"`
}

// searxngResponse is the raw response from SearXNG.
type searxngResponse struct {
	Results []searxngResult `json:"results"`
}

type searxngResult struct {
	URL           string  `json:"url"`
	Title         string  `json:"title"`
	Content       string  `json:"content"`
	Engine        string  `json:"engine"`
	Score         float64 `json:"score"`
	PublishedDate string  `json:"publishedDate,omitempty"`
	Thumbnail     string  `json:"thumbnail,omitempty"`
	Category      string  `json:"category"`
}

// Search queries SearXNG and returns normalized, scored results.
func (p *SearxngProvider) Search(ctx context.Context, req *SearchRequest) ([]SearchResult, error) {
	params := url.Values{}
	params.Set("q", req.Query)
	params.Set("format", "json")

	if req.Options != nil {
		if len(req.Options.Categories) > 0 {
			params.Set("categories", strings.Join(req.Options.Categories, ","))
		}
		if len(req.Options.Engines) > 0 {
			params.Set("engines", strings.Join(req.Options.Engines, ","))
		}
		if req.Options.Language != "" {
			params.Set("language", req.Options.Language)
		}
		if req.Options.TimeRange != "" {
			params.Set("time_range", req.Options.TimeRange)
		}
		params.Set("safesearch", fmt.Sprintf("%d", req.Options.SafeSearch))
	}

	reqURL := fmt.Sprintf("%s/search?%s", p.baseURL, params.Encode())
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := p.client.Do(httpReq)
	if err != nil {
		if ctx.Err() != nil {
			return nil, fmt.Errorf("searxng timeout")
		}
		return nil, fmt.Errorf("searxng unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("searxng returned %d: %s", resp.StatusCode, string(body))
	}

	var sxResp searxngResponse
	if err := json.NewDecoder(resp.Body).Decode(&sxResp); err != nil {
		return nil, fmt.Errorf("decode searxng response: %w", err)
	}

	return normalizeResults(sxResp.Results, req.Options), nil
}

// HealthCheck pings SearXNG.
func (p *SearxngProvider) HealthCheck(ctx context.Context) (string, int64) {
	start := time.Now()
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.baseURL+"/healthz", nil)
	if err != nil {
		return "error", time.Since(start).Milliseconds()
	}
	resp, err := p.client.Do(req)
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return "error", latency
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "error", latency
	}
	return "ok", latency
}

// GetEngines fetches available engines from SearXNG config.
func (p *SearxngProvider) GetEngines(ctx context.Context) []string {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.baseURL+"/config", nil)
	if err != nil {
		return nil
	}
	resp, err := p.client.Do(req)
	if err != nil {
		slog.Warn("failed to fetch searxng engines", "error", err)
		return nil
	}
	defer resp.Body.Close()

	var cfg struct {
		Engines map[string]any `json:"engines"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&cfg); err != nil {
		return nil
	}

	engines := make([]string, 0, len(cfg.Engines))
	for name := range cfg.Engines {
		engines = append(engines, name)
	}
	sort.Strings(engines)
	return engines
}

// BuildCacheKey creates a deterministic cache key from the search request.
func BuildCacheKey(req *SearchRequest) string {
	var categories, engines, language, timeRange string
	safeSearch := 0

	if req.Options != nil {
		cats := make([]string, len(req.Options.Categories))
		copy(cats, req.Options.Categories)
		sort.Strings(cats)
		categories = strings.Join(cats, ",")

		engs := make([]string, len(req.Options.Engines))
		copy(engs, req.Options.Engines)
		sort.Strings(engs)
		engines = strings.Join(engs, ",")

		language = strings.ToLower(req.Options.Language)
		timeRange = req.Options.TimeRange
		safeSearch = req.Options.SafeSearch
	}

	return fmt.Sprintf("search:%s:%s:%s:%s:%s:%d",
		strings.ToLower(req.Query), categories, engines, language, timeRange, safeSearch)
}

// Trusted domains get a score boost.
var trustedDomains = map[string]bool{
	"wikipedia.org":    true,
	"github.com":       true,
	"stackoverflow.com": true,
}

func normalizeResults(raw []searxngResult, opts *SearchOptions) []SearchResult {
	seen := make(map[string]bool)
	var results []SearchResult

	for _, r := range raw {
		if seen[r.URL] {
			continue
		}
		seen[r.URL] = true

		score := scoreResult(r)
		results = append(results, SearchResult{
			URL:           r.URL,
			Title:         r.Title,
			Snippet:       r.Content,
			Engine:        r.Engine,
			Score:         score,
			PublishedDate: r.PublishedDate,
			Thumbnail:     r.Thumbnail,
			Category:      r.Category,
		})
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	limit := 10
	if opts != nil && opts.Limit > 0 && opts.Limit <= 50 {
		limit = opts.Limit
	}
	if len(results) > limit {
		results = results[:limit]
	}

	return results
}

func scoreResult(r searxngResult) float64 {
	score := 0.5

	if len(r.Content) > 100 {
		score += 0.1
	}

	// Check if URL is from a trusted domain
	if u, err := url.Parse(r.URL); err == nil {
		host := strings.ToLower(u.Hostname())
		for domain := range trustedDomains {
			if strings.HasSuffix(host, domain) {
				score += 0.15
				break
			}
		}
	}

	if len(r.URL) > 200 {
		score -= 0.05
	}

	return math.Max(0, math.Min(1, score))
}
