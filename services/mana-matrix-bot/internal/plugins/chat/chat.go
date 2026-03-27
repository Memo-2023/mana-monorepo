package chat

import (
	"context"
	"log/slog"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("chat", func() plugin.Plugin { return &ChatPlugin{} })
}

// ChatPlugin proxies to the chat backend for conversation management.
type ChatPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *ChatPlugin) Name() string { return "chat" }

func (p *ChatPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("chat plugin initialized")
	return nil
}

func (p *ChatPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!help"}, Description: "Hilfe", Category: "System"},
		{Patterns: []string{"!status"}, Description: "Status", Category: "System"},
	}
}

func (p *ChatPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *ChatPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**Chat Bot:** ✅ Online")
	return nil
}

func (p *ChatPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**💬 Chat Bot**\n\n• `!status` — Bot-Status\n• `!hilfe` — Diese Hilfe")
	return nil
}
