package presi

import (
	"context"
	"log/slog"

	"github.com/mana/mana-matrix-bot/internal/plugin"
	"github.com/mana/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("presi", func() plugin.Plugin { return &PresiPlugin{} })
}

type PresiPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *PresiPlugin) Name() string { return "presi" }

func (p *PresiPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!presentations", p.cmdList)
	p.router.Handle("!präsentationen", p.cmdList)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("presi plugin initialized")
	return nil
}

func (p *PresiPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!presentations"}, Description: "Präsentationen", Category: "Presi"},
	}
}

func (p *PresiPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *PresiPlugin) cmdList(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**📊 Präsentationen**\n\n_Verwaltung über die Web-App._")
	return nil
}
func (p *PresiPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**Presi Bot:** ✅ Online")
	return nil
}
func (p *PresiPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**📊 Presi Bot**\n\n• `!präsentationen` — Liste\n• `!status` — Status")
	return nil
}
