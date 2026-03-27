package runtime

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

// HealthServer serves health and metrics endpoints.
type HealthServer struct {
	runtime *Runtime
	port    int
}

// NewHealthServer creates a new health server.
func NewHealthServer(rt *Runtime, port int) *HealthServer {
	return &HealthServer{runtime: rt, port: port}
}

// Start starts the HTTP health server.
func (h *HealthServer) Start() *http.Server {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", h.handleHealth)
	mux.HandleFunc("GET /metrics", h.handleMetrics)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", h.port),
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	go func() {
		slog.Info("health server starting", "port", h.port)
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			slog.Error("health server error", "error", err)
		}
	}()

	return server
}

func (h *HealthServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	plugins := h.runtime.ActivePlugins()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":    "ok",
		"service":   "mana-matrix-bot",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"plugins":   plugins,
		"count":     len(plugins),
	})
}

func (h *HealthServer) handleMetrics(w http.ResponseWriter, r *http.Request) {
	plugins := h.runtime.ActivePlugins()

	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprintf(w, "# HELP mana_matrix_bot_plugins_active Number of active plugins\n")
	fmt.Fprintf(w, "# TYPE mana_matrix_bot_plugins_active gauge\n")
	fmt.Fprintf(w, "mana_matrix_bot_plugins_active %d\n", len(plugins))
}
