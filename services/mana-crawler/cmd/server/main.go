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

	"github.com/mana/mana-crawler/internal/config"
	"github.com/mana/mana-crawler/internal/crawler"
	"github.com/mana/mana-crawler/internal/db"
	"github.com/mana/mana-crawler/internal/handler"
	"github.com/mana/mana-crawler/internal/robots"
	"github.com/rs/cors"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	cfg := config.Load()
	ctx := context.Background()

	// Database
	database, err := db.New(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	if err := database.Migrate(ctx); err != nil {
		slog.Error("migration failed", "error", err)
		os.Exit(1)
	}

	// Robots checker
	robotsChecker := robots.NewChecker(cfg.UserAgent)

	// Crawler engine
	crawlerEngine := crawler.New(
		database.Pool,
		robotsChecker,
		cfg.UserAgent,
		cfg.Concurrency,
		time.Duration(cfg.Timeout)*time.Millisecond,
	)

	// Handler
	h := handler.NewHandler(database.Pool, crawlerEngine)

	// Routes
	mux := http.NewServeMux()

	// Health & Metrics
	mux.HandleFunc("GET /health", h.Health)
	mux.HandleFunc("GET /metrics", h.Metrics)

	// Crawl API
	mux.HandleFunc("POST /api/v1/crawl", h.StartCrawl)
	mux.HandleFunc("GET /api/v1/crawl", h.ListJobs)
	mux.HandleFunc("GET /api/v1/crawl/{jobId}", h.GetJob)
	mux.HandleFunc("GET /api/v1/crawl/{jobId}/results", h.GetJobResults)
	mux.HandleFunc("DELETE /api/v1/crawl/{jobId}", h.CancelJob)

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      c.Handler(mux),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		slog.Info("shutting down...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		server.Shutdown(ctx)
	}()

	slog.Info("mana-crawler starting", "port", cfg.Port, "concurrency", cfg.Concurrency)
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}
