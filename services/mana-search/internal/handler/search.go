package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/mana/shared-go/httputil"
	"sort"
	"time"

	"github.com/mana/mana-search/internal/cache"
	"github.com/mana/mana-search/internal/config"
	"github.com/mana/mana-search/internal/metrics"
	"github.com/mana/mana-search/internal/search"
)

type SearchHandler struct {
	provider *search.SearxngProvider
	cache    *cache.Cache
	metrics  *metrics.Metrics
	cfg      *config.Config
}

func NewSearchHandler(provider *search.SearxngProvider, c *cache.Cache, m *metrics.Metrics, cfg *config.Config) *SearchHandler {
	return &SearchHandler{
		provider: provider,
		cache:    c,
		metrics:  m,
		cfg:      cfg,
	}
}

// Search handles POST /api/v1/search
func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	h.metrics.ActiveSearches.Inc()
	defer h.metrics.ActiveSearches.Dec()

	var req search.SearchRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Query == "" {
		httputil.WriteError(w, http.StatusBadRequest, "query is required")
		return
	}

	// Validate options
	if req.Options != nil {
		if req.Options.Limit < 0 || req.Options.Limit > 50 {
			httputil.WriteError(w, http.StatusBadRequest, "limit must be between 1 and 50")
			return
		}
		if req.Options.SafeSearch < 0 || req.Options.SafeSearch > 2 {
			httputil.WriteError(w, http.StatusBadRequest, "safeSearch must be 0, 1, or 2")
			return
		}
	}

	cacheKey := search.BuildCacheKey(&req)

	// Check cache
	if req.Cache.IsEnabled() {
		if data, ok := h.cache.Get(r.Context(), cacheKey); ok {
			var cached search.SearchResponse
			if err := json.Unmarshal(data, &cached); err == nil {
				cached.Meta.Cached = true
				cached.Meta.CacheKey = cacheKey
				duration := time.Since(start).Seconds()
				h.metrics.RecordRequest("search", "200", duration)
				httputil.WriteJSON(w, http.StatusOK, cached)
				return
			}
		}
	}

	// Query SearXNG
	results, err := h.provider.Search(r.Context(), &req)
	if err != nil {
		slog.Error("search failed", "error", err, "query", req.Query)
		duration := time.Since(start).Seconds()
		h.metrics.RecordRequest("search", "502", duration)
		httputil.WriteError(w, http.StatusBadGateway, err.Error())
		return
	}

	// Collect unique engines (sorted for deterministic cache keys)
	engineSet := make(map[string]bool)
	for _, res := range results {
		engineSet[res.Engine] = true
	}
	engines := make([]string, 0, len(engineSet))
	for e := range engineSet {
		engines = append(engines, e)
	}
	sort.Strings(engines)

	resp := search.SearchResponse{
		Results: results,
		Meta: search.SearchMeta{
			Query:        req.Query,
			TotalResults: len(results),
			Engines:      engines,
			Duration:     time.Since(start).Milliseconds(),
			Cached:       false,
			CacheKey:     cacheKey,
		},
	}

	// Cache result
	if req.Cache.IsEnabled() {
		ttl := time.Duration(h.cfg.CacheSearchTTL) * time.Second
		if req.Cache != nil && req.Cache.TTL > 0 {
			ttl = time.Duration(req.Cache.TTL) * time.Second
		}
		h.cache.Set(r.Context(), cacheKey, resp, ttl)
	}

	duration := time.Since(start).Seconds()
	h.metrics.RecordRequest("search", "200", duration)
	httputil.WriteJSON(w, http.StatusOK, resp)
}

// Engines handles GET /api/v1/search/engines
func (h *SearchHandler) Engines(w http.ResponseWriter, r *http.Request) {
	engines := h.provider.GetEngines(r.Context())
	httputil.WriteJSON(w, http.StatusOK, map[string]any{"engines": engines})
}

// Health handles GET /api/v1/search/health
func (h *SearchHandler) Health(w http.ResponseWriter, r *http.Request) {
	sxStatus, sxLatency := h.provider.HealthCheck(r.Context())
	redisHealth := h.cache.HealthCheck(r.Context())
	cacheStats := h.cache.Stats()

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"searxng": map[string]any{
			"status":  sxStatus,
			"latency": sxLatency,
		},
		"redis": redisHealth,
		"cache": cacheStats,
	})
}

// ClearCache handles DELETE /api/v1/search/cache
func (h *SearchHandler) ClearCache(w http.ResponseWriter, r *http.Request) {
	deleted, err := h.cache.Clear(r.Context())
	if err != nil {
		httputil.WriteError(w, http.StatusInternalServerError, "failed to clear cache")
		return
	}
	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"cleared":     true,
		"keysRemoved": deleted,
	})
}
