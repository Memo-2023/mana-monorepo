package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/manacore/mana-matrix-bot/internal/config"
	"github.com/manacore/mana-matrix-bot/internal/runtime"

	// Import all plugins to trigger their init() registration.
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/calendar"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/chat"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/clock"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/contacts"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/gateway"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/cards"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/nutriphi"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/ollama"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/onboarding"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/picture"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/planta"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/presi"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/projectdoc"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/questions"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/skilltree"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/stats"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/storage"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/stt"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/todo"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/tts"
	_ "github.com/manacore/mana-matrix-bot/internal/plugins/zitare"
)

func main() {
	// Structured JSON logging
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	cfg := config.Load()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create and start runtime
	rt := runtime.New(cfg)

	// Start health server
	health := runtime.NewHealthServer(rt, cfg.Port)
	httpServer := health.Start()

	// Start all plugins
	if err := rt.Start(ctx); err != nil {
		slog.Error("failed to start runtime", "error", err)
		os.Exit(1)
	}

	slog.Info("mana-matrix-bot running", "port", cfg.Port)

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	slog.Info("shutting down...")
	cancel()
	rt.Stop()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	httpServer.Shutdown(shutdownCtx)

	slog.Info("shutdown complete")
}
