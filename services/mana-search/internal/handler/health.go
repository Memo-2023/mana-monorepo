package handler

import (
	"net/http"

	"github.com/mana/shared-go/httputil"
	"time"

	"github.com/mana/mana-search/internal/cache"
	"github.com/mana/mana-search/internal/search"
)

type HealthHandler struct {
	provider  *search.SearxngProvider
	cache     *cache.Cache
	startTime time.Time
}

func NewHealthHandler(provider *search.SearxngProvider, c *cache.Cache) *HealthHandler {
	return &HealthHandler{
		provider:  provider,
		cache:     c,
		startTime: time.Now(),
	}
}

// Health handles GET /health
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	sxStatus, sxLatency := h.provider.HealthCheck(r.Context())
	redisHealth := h.cache.HealthCheck(r.Context())

	overall := "ok"
	if sxStatus == "error" && redisHealth.Status == "error" {
		overall = "error"
	} else if sxStatus == "error" || redisHealth.Status == "error" || redisHealth.Status == "disabled" {
		overall = "degraded"
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"status":  overall,
		"service": "mana-search",
		"version": "1.0.0",
		"uptime":  time.Since(h.startTime).Seconds(),
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"components": map[string]any{
			"searxng": map[string]any{
				"status":  sxStatus,
				"latency": sxLatency,
			},
			"redis": redisHealth,
		},
	})
}
