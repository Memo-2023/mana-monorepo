package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/cors"

	"github.com/manacore/mana-search/internal/cache"
	"github.com/manacore/mana-search/internal/config"
	"github.com/manacore/mana-search/internal/extract"
	"github.com/manacore/mana-search/internal/handler"
	"github.com/manacore/mana-search/internal/metrics"
	"github.com/manacore/mana-search/internal/search"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	cfg := config.Load()
	m := metrics.New()
	c := cache.New(cfg, m)
	defer c.Close()

	provider := search.NewSearxngProvider(cfg)
	extractor := extract.New(cfg)

	searchHandler := handler.NewSearchHandler(provider, c, m, cfg)
	extractHandler := handler.NewExtractHandler(extractor, c, m, cfg)
	healthHandler := handler.NewHealthHandler(provider, c)

	mux := http.NewServeMux()

	// Health & metrics
	mux.HandleFunc("GET /health", healthHandler.Health)
	mux.HandleFunc("GET /api/v1/health", healthHandler.Health)
	mux.Handle("GET /metrics", promhttp.Handler())

	// Search endpoints
	mux.HandleFunc("POST /api/v1/search", searchHandler.Search)
	mux.HandleFunc("GET /api/v1/search/engines", searchHandler.Engines)
	mux.HandleFunc("GET /api/v1/search/health", searchHandler.Health)
	mux.HandleFunc("DELETE /api/v1/search/cache", searchHandler.ClearCache)

	// Extract endpoints
	mux.HandleFunc("POST /api/v1/extract", extractHandler.Extract)
	mux.HandleFunc("POST /api/v1/extract/bulk", extractHandler.BulkExtract)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(mux)

	server := &http.Server{
		Addr:           fmt.Sprintf(":%d", cfg.Port),
		Handler:        corsHandler,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   60 * time.Second,
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Graceful shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		slog.Info("mana-search started", "port", cfg.Port, "searxng", cfg.SearxngURL)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-sigCh
	slog.Info("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "error", err)
	}

	slog.Info("server stopped")
}
