package storage

import (
	"context"
	"log/slog"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("storage", func() plugin.Plugin { return &StoragePlugin{} })
}

type StoragePlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *StoragePlugin) Name() string { return "storage" }

func (p *StoragePlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!files", p.cmdFiles)
	p.router.Handle("!dateien", p.cmdFiles)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("storage plugin initialized")
	return nil
}

func (p *StoragePlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!files", "!dateien"}, Description: "Dateien anzeigen", Category: "Storage"},
	}
}

func (p *StoragePlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *StoragePlugin) cmdFiles(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**📁 Dateien**\n\n_Dateiverwaltung über die Web-App._")
	return nil
}
func (p *StoragePlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**Storage Bot:** ✅ Online")
	return nil
}
func (p *StoragePlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**📁 Storage Bot**\n\n• `!dateien` — Dateien\n• `!status` — Status")
	return nil
}
