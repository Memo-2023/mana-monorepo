package questions

import (
	"context"
	"log/slog"

	"github.com/mana/mana-matrix-bot/internal/plugin"
	"github.com/mana/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("questions", func() plugin.Plugin { return &QuestionsPlugin{} })
}

type QuestionsPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *QuestionsPlugin) Name() string { return "questions" }

func (p *QuestionsPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!frage", p.cmdAsk)
	p.router.Handle("!ask", p.cmdAsk)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("questions plugin initialized")
	return nil
}

func (p *QuestionsPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!frage", "!ask"}, Description: "Frage stellen", Category: "Q&A"},
	}
}

func (p *QuestionsPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *QuestionsPlugin) cmdAsk(mc *plugin.MessageContext, args string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**❓ Fragen**\n\n_Q&A-System über die Web-App verfügbar._")
	return nil
}
func (p *QuestionsPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**Questions Bot:** ✅ Online")
	return nil
}
func (p *QuestionsPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**❓ Questions Bot**\n\n• `!frage [text]` — Frage stellen\n• `!status` — Status")
	return nil
}
