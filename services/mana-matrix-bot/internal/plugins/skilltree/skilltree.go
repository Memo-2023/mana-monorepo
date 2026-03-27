package skilltree

import (
	"context"
	"log/slog"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("skilltree", func() plugin.Plugin { return &SkilltreePlugin{} })
}

type SkilltreePlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *SkilltreePlugin) Name() string { return "skilltree" }

func (p *SkilltreePlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!skills", p.cmdSkills)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("skilltree plugin initialized")
	return nil
}

func (p *SkilltreePlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!skills"}, Description: "Skill-Übersicht", Category: "Skilltree"},
	}
}

func (p *SkilltreePlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *SkilltreePlugin) cmdSkills(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🌳 Skills**\n\n_Skill-Verwaltung über die Web-App._")
	return nil
}
func (p *SkilltreePlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**Skilltree Bot:** ✅ Online")
	return nil
}
func (p *SkilltreePlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🌳 Skilltree Bot**\n\n• `!skills` — Übersicht\n• `!status` — Status")
	return nil
}
