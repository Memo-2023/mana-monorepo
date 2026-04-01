package cards

import (
	"context"
	"log/slog"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("cards", func() plugin.Plugin { return &CardsPlugin{} })
}

type CardsPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *CardsPlugin) Name() string { return "cards" }

func (p *CardsPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!decks", p.cmdDecks)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("cards plugin initialized")
	return nil
}

func (p *CardsPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!decks"}, Description: "Alle Decks", Category: "Cards"},
		{Patterns: []string{"!status"}, Description: "Status", Category: "System"},
	}
}

func (p *CardsPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *CardsPlugin) cmdDecks(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🃏 Decks**\n\n_Deck-Verwaltung über die Web-App._")
	return nil
}
func (p *CardsPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**Cards Bot:** ✅ Online")
	return nil
}
func (p *CardsPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🃏 Cards Bot**\n\n• `!decks` — Decks anzeigen\n• `!status` — Status")
	return nil
}
