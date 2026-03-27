package handler

import (
	"net/http"
	"time"

	"github.com/manacore/mana-notify/internal/db"
)

type HealthHandler struct {
	db        *db.DB
	startTime time.Time
}

func NewHealthHandler(database *db.DB) *HealthHandler {
	return &HealthHandler{db: database, startTime: time.Now()}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	dbOK := h.db.HealthCheck(r.Context()) == nil

	status := "healthy"
	if !dbOK {
		status = "unhealthy"
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":    status,
		"version":   "1.0.0",
		"service":   "mana-notify",
		"uptime":    time.Since(h.startTime).Seconds(),
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"services": map[string]any{
			"database": dbOK,
			"redis":    true,
		},
	})
}
