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

	"github.com/manacore/mana-api-gateway/internal/config"
	"github.com/manacore/mana-api-gateway/internal/db"
	"github.com/manacore/mana-api-gateway/internal/handler"
	"github.com/manacore/mana-api-gateway/internal/middleware"
	"github.com/manacore/mana-api-gateway/internal/proxy"
	"github.com/manacore/mana-api-gateway/internal/service"
	"github.com/redis/go-redis/v9"
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

	// Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       0,
	})
	if err := rdb.Ping(ctx).Err(); err != nil {
		slog.Warn("redis unavailable, rate limiting disabled", "error", err)
	} else {
		slog.Info("redis connected")
	}
	defer rdb.Close()

	// Services
	apiKeySvc := service.NewApiKeyService(database.Pool, cfg.KeyPrefixLive, cfg.KeyPrefixTest)
	usageSvc := service.NewUsageService(database.Pool)

	// Handlers
	apiKeysHandler := handler.NewApiKeysHandler(apiKeySvc, usageSvc)
	healthHandler := handler.NewHealthHandler(database.Pool, rdb)

	// Proxy
	serviceProxy := proxy.NewServiceProxy(cfg.SearchURL, cfg.STTURL, cfg.TTSURL, apiKeySvc, usageSvc)

	// Middleware chains
	apiKeyAuth := middleware.ApiKeyMiddleware(apiKeySvc)
	rateLimit := middleware.RateLimitMiddleware(rdb, cfg.RedisPrefix)
	creditsCheck := middleware.CreditsMiddleware(apiKeySvc)
	jwtAuth := middleware.JWTMiddleware(cfg.AuthURL)

	// Chain: API Key → Rate Limit → Credits → Handler
	publicChain := func(h http.Handler) http.Handler {
		return apiKeyAuth(rateLimit(creditsCheck(h)))
	}

	// Routes
	mux := http.NewServeMux()

	// Health & Metrics (public, no auth)
	mux.HandleFunc("GET /health", healthHandler.Health)
	mux.HandleFunc("GET /metrics", healthHandler.Metrics)

	// Public API (API Key auth + rate limit + credits)
	mux.Handle("POST /v1/search", publicChain(http.HandlerFunc(serviceProxy.HandleSearch)))
	mux.Handle("POST /v1/extract", publicChain(http.HandlerFunc(serviceProxy.HandleSearch)))
	mux.Handle("POST /v1/extract/bulk", publicChain(http.HandlerFunc(serviceProxy.HandleSearch)))
	mux.Handle("GET /v1/search/engines", publicChain(http.HandlerFunc(serviceProxy.HandleSearch)))
	mux.Handle("POST /v1/stt/transcribe", publicChain(http.HandlerFunc(serviceProxy.HandleSTT)))
	mux.Handle("GET /v1/stt/models", publicChain(http.HandlerFunc(serviceProxy.HandleSTT)))
	mux.Handle("GET /v1/stt/languages", publicChain(http.HandlerFunc(serviceProxy.HandleSTT)))
	mux.Handle("POST /v1/tts/synthesize", publicChain(http.HandlerFunc(serviceProxy.HandleTTS)))
	mux.Handle("GET /v1/tts/voices", publicChain(http.HandlerFunc(serviceProxy.HandleTTS)))
	mux.Handle("GET /v1/tts/languages", publicChain(http.HandlerFunc(serviceProxy.HandleTTS)))

	// Management API (JWT auth)
	mux.Handle("POST /api-keys", jwtAuth(http.HandlerFunc(apiKeysHandler.CreateKey)))
	mux.Handle("GET /api-keys", jwtAuth(http.HandlerFunc(apiKeysHandler.ListKeys)))
	mux.Handle("DELETE /api-keys/{id}", jwtAuth(http.HandlerFunc(apiKeysHandler.DeleteKey)))
	mux.Handle("GET /api-keys/{id}/usage", jwtAuth(http.HandlerFunc(apiKeysHandler.GetUsage)))
	mux.Handle("GET /api-keys/{id}/usage/summary", jwtAuth(http.HandlerFunc(apiKeysHandler.GetUsageSummary)))

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-API-Key"},
		AllowCredentials: true,
	})

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      c.Handler(mux),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		slog.Info("shutting down...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		server.Shutdown(ctx)
	}()

	slog.Info("mana-api-gateway starting", "port", cfg.Port)
	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}
