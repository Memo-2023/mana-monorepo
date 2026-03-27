package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// HealthHandler handles health and metrics endpoints.
type HealthHandler struct {
	pool      *pgxpool.Pool
	redis     *redis.Client
	startTime time.Time
}

// NewHealthHandler creates a new health handler.
func NewHealthHandler(pool *pgxpool.Pool, rdb *redis.Client) *HealthHandler {
	return &HealthHandler{pool: pool, redis: rdb, startTime: time.Now()}
}

// Health handles GET /health
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	dbOK := "ok"
	if err := h.pool.Ping(ctx); err != nil {
		dbOK = "error"
	}

	redisOK := "ok"
	if err := h.redis.Ping(ctx).Err(); err != nil {
		redisOK = "error"
	}

	status := "ok"
	if dbOK != "ok" || redisOK != "ok" {
		status = "degraded"
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":    status,
		"service":   "mana-api-gateway",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"uptime":    time.Since(h.startTime).Seconds(),
		"database":  dbOK,
		"redis":     redisOK,
	})
}

// Metrics handles GET /metrics (Prometheus format)
func (h *HealthHandler) Metrics(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(h.startTime).Seconds()

	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprintf(w, "# HELP mana_api_gateway_uptime_seconds Gateway uptime\n")
	fmt.Fprintf(w, "# TYPE mana_api_gateway_uptime_seconds gauge\n")
	fmt.Fprintf(w, "mana_api_gateway_uptime_seconds %.0f\n", uptime)

	// DB pool stats
	stats := h.pool.Stat()
	fmt.Fprintf(w, "# HELP mana_api_gateway_db_connections Database connection pool\n")
	fmt.Fprintf(w, "# TYPE mana_api_gateway_db_connections gauge\n")
	fmt.Fprintf(w, "mana_api_gateway_db_connections{state=\"total\"} %d\n", stats.TotalConns())
	fmt.Fprintf(w, "mana_api_gateway_db_connections{state=\"idle\"} %d\n", stats.IdleConns())
	fmt.Fprintf(w, "mana_api_gateway_db_connections{state=\"acquired\"} %d\n", stats.AcquiredConns())
}
