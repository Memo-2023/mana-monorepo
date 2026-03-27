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

	"github.com/manacore/mana-notify/internal/auth"
	"github.com/manacore/mana-notify/internal/channel"
	"github.com/manacore/mana-notify/internal/config"
	"github.com/manacore/mana-notify/internal/db"
	"github.com/manacore/mana-notify/internal/handler"
	"github.com/manacore/mana-notify/internal/metrics"
	"github.com/manacore/mana-notify/internal/queue"
	tmpl "github.com/manacore/mana-notify/internal/template"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	database, err := db.New(ctx, cfg.DatabaseURL)
	cancel()
	if err != nil {
		slog.Error("database init failed", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	// Initialize services
	m := metrics.New()
	emailSvc := channel.NewEmailService(cfg)
	pushSvc := channel.NewPushService(cfg)
	matrixSvc := channel.NewMatrixService(cfg)
	webhookSvc := channel.NewWebhookService()
	engine := tmpl.NewEngine(database)

	// Seed default templates
	engine.SeedDefaults(context.Background())

	// Start worker pool
	workerPool := queue.NewWorkerPool(database, emailSvc, pushSvc, matrixSvc, webhookSvc, m)
	workerPool.Start()
	defer workerPool.Stop()

	// Handlers
	notifHandler := handler.NewNotificationsHandler(database, workerPool, engine)
	tmplHandler := handler.NewTemplatesHandler(database, engine)
	devicesHandler := handler.NewDevicesHandler(database)
	prefsHandler := handler.NewPreferencesHandler(database)
	healthHandler := handler.NewHealthHandler(database)

	// Middleware
	serviceAuth := auth.ValidateServiceKey(cfg.ServiceKey)
	jwtAuth := auth.ValidateJWT(cfg.ManaCoreAuthURL)

	mux := http.NewServeMux()

	// System endpoints (no auth)
	mux.HandleFunc("GET /health", healthHandler.Health)
	mux.Handle("GET /metrics", promhttp.Handler())

	// Notification endpoints (service key auth)
	mux.Handle("POST /api/v1/notifications/send", serviceAuth(http.HandlerFunc(notifHandler.Send)))
	mux.Handle("POST /api/v1/notifications/schedule", serviceAuth(http.HandlerFunc(notifHandler.Schedule)))
	mux.Handle("POST /api/v1/notifications/batch", serviceAuth(http.HandlerFunc(notifHandler.Batch)))
	mux.Handle("GET /api/v1/notifications/{id}", serviceAuth(http.HandlerFunc(notifHandler.GetNotification)))
	mux.Handle("DELETE /api/v1/notifications/{id}", serviceAuth(http.HandlerFunc(notifHandler.CancelNotification)))

	// Template endpoints (service key auth)
	mux.Handle("GET /api/v1/templates", serviceAuth(http.HandlerFunc(tmplHandler.List)))
	mux.Handle("POST /api/v1/templates", serviceAuth(http.HandlerFunc(tmplHandler.Create)))
	mux.Handle("POST /api/v1/templates/preview", serviceAuth(http.HandlerFunc(tmplHandler.PreviewCustom)))
	mux.Handle("GET /api/v1/templates/{slug}", serviceAuth(http.HandlerFunc(tmplHandler.Get)))
	mux.Handle("PUT /api/v1/templates/{slug}", serviceAuth(http.HandlerFunc(tmplHandler.Update)))
	mux.Handle("DELETE /api/v1/templates/{slug}", serviceAuth(http.HandlerFunc(tmplHandler.Delete)))
	mux.Handle("POST /api/v1/templates/{slug}/preview", serviceAuth(http.HandlerFunc(tmplHandler.Preview)))

	// Device endpoints (JWT auth)
	mux.Handle("POST /api/v1/devices/register", jwtAuth(http.HandlerFunc(devicesHandler.Register)))
	mux.Handle("GET /api/v1/devices", jwtAuth(http.HandlerFunc(devicesHandler.List)))
	mux.Handle("DELETE /api/v1/devices/{id}", jwtAuth(http.HandlerFunc(devicesHandler.Delete)))

	// Preference endpoints (JWT auth)
	mux.Handle("GET /api/v1/preferences", jwtAuth(http.HandlerFunc(prefsHandler.Get)))
	mux.Handle("PUT /api/v1/preferences", jwtAuth(http.HandlerFunc(prefsHandler.Update)))

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Service-Key"},
		AllowCredentials: true,
	}).Handler(mux)

	server := &http.Server{
		Addr:           fmt.Sprintf(":%d", cfg.Port),
		Handler:        corsHandler,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   60 * time.Second,
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		slog.Info("mana-notify started", "port", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-sigCh
	slog.Info("shutting down...")

	ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "error", err)
	}

	slog.Info("server stopped")
}
