package handler

import (
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	"github.com/manacore/mana-search/internal/cache"
	"github.com/manacore/mana-search/internal/config"
	"github.com/manacore/mana-search/internal/extract"
	"github.com/manacore/mana-search/internal/metrics"
)

type ExtractHandler struct {
	extractor *extract.Extractor
	cache     *cache.Cache
	metrics   *metrics.Metrics
	cfg       *config.Config
}

func NewExtractHandler(extractor *extract.Extractor, c *cache.Cache, m *metrics.Metrics, cfg *config.Config) *ExtractHandler {
	return &ExtractHandler{
		extractor: extractor,
		cache:     c,
		metrics:   m,
		cfg:       cfg,
	}
}

// Extract handles POST /api/v1/extract
func (h *ExtractHandler) Extract(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req extract.ExtractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.URL == "" {
		writeError(w, http.StatusBadRequest, "url is required")
		return
	}
	if _, err := url.ParseRequestURI(req.URL); err != nil {
		writeError(w, http.StatusBadRequest, "url must be a valid URL")
		return
	}

	// Validate options
	if req.Options != nil {
		if req.Options.MaxLength > 0 && (req.Options.MaxLength < 100 || req.Options.MaxLength > 100000) {
			writeError(w, http.StatusBadRequest, "maxLength must be between 100 and 100000")
			return
		}
		if req.Options.Timeout > 0 && (req.Options.Timeout < 1000 || req.Options.Timeout > 30000) {
			writeError(w, http.StatusBadRequest, "timeout must be between 1000 and 30000")
			return
		}
	}

	cacheKey := extract.BuildCacheKey(req.URL)

	// Check cache
	if data, ok := h.cache.Get(r.Context(), cacheKey); ok {
		var cached extract.ExtractResponse
		if err := json.Unmarshal(data, &cached); err == nil {
			cached.Meta.Cached = true
			duration := time.Since(start).Seconds()
			h.metrics.RecordRequest("extract", "200", duration)
			writeJSON(w, http.StatusOK, cached)
			return
		}
	}

	// Extract content
	resp := h.extractor.Extract(r.Context(), &req)

	// Cache successful results
	if resp.Success {
		ttl := time.Duration(h.cfg.CacheExtractTTL) * time.Second
		h.cache.Set(r.Context(), cacheKey, resp, ttl)
	}

	status := "200"
	if !resp.Success {
		status = "500"
	}
	duration := time.Since(start).Seconds()
	h.metrics.RecordRequest("extract", status, duration)

	writeJSON(w, http.StatusOK, resp)
}

// BulkExtract handles POST /api/v1/extract/bulk
func (h *ExtractHandler) BulkExtract(w http.ResponseWriter, r *http.Request) {
	start := time.Now()

	var req extract.BulkExtractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if len(req.URLs) == 0 {
		writeError(w, http.StatusBadRequest, "urls is required")
		return
	}
	if len(req.URLs) > 20 {
		writeError(w, http.StatusBadRequest, "maximum 20 URLs allowed")
		return
	}

	for _, u := range req.URLs {
		if _, err := url.ParseRequestURI(u); err != nil {
			writeError(w, http.StatusBadRequest, "invalid URL: "+u)
			return
		}
	}

	resp := h.extractor.BulkExtract(r.Context(), &req)

	duration := time.Since(start).Seconds()
	h.metrics.RecordRequest("extract_bulk", "200", duration)

	writeJSON(w, http.StatusOK, resp)
}
