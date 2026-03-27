package manadeck

import (
	"context"
	"log/slog"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("manadeck", func() plugin.Plugin { return &ManaDeckPlugin{} })
}

type ManaDeckPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *ManaDeckPlugin) Name() string { return "manadeck" }

func (p *ManaDeckPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!decks", p.cmdDecks)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("manadeck plugin initialized")
	return nil
}

func (p *ManaDeckPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!decks"}, Description: "Alle Decks", Category: "ManaDeck"},
		{Patterns: []string{"!status"}, Description: "Status", Category: "System"},
	}
}

func (p *ManaDeckPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *ManaDeckPlugin) cmdDecks(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🃏 Decks**\n\n_Deck-Verwaltung über die Web-App._")
	return nil
}
func (p *ManaDeckPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**ManaDeck Bot:** ✅ Online")
	return nil
}
func (p *ManaDeckPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🃏 ManaDeck Bot**\n\n• `!decks` — Decks anzeigen\n• `!status` — Status")
	return nil
}
