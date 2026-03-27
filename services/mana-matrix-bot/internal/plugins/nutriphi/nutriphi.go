package nutriphi

import (
	"context"
	"log/slog"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("nutriphi", func() plugin.Plugin { return &NutriPhiPlugin{} })
}

type NutriPhiPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *NutriPhiPlugin) Name() string { return "nutriphi" }

func (p *NutriPhiPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!heute", p.cmdToday)
	p.router.Handle("!today", p.cmdToday)
	p.router.Handle("!log", p.cmdLog)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("nutriphi plugin initialized")
	return nil
}

func (p *NutriPhiPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!heute", "!today"}, Description: "Heutige Mahlzeiten", Category: "Ernährung"},
		{Patterns: []string{"!log [mahlzeit]"}, Description: "Mahlzeit loggen", Category: "Ernährung"},
	}
}

func (p *NutriPhiPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *NutriPhiPlugin) cmdToday(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🍽️ Heute**\n\n_Keine Mahlzeiten geloggt._")
	return nil
}
func (p *NutriPhiPlugin) cmdLog(mc *plugin.MessageContext, args string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🍽️ Mahlzeit loggen**\n\n_Sende ein Foto oder beschreibe die Mahlzeit._")
	return nil
}
func (p *NutriPhiPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**NutriPhi Bot:** ✅ Online")
	return nil
}
func (p *NutriPhiPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🍽️ NutriPhi Bot**\n\n• `!heute` — Heutige Mahlzeiten\n• `!log Pizza` — Mahlzeit loggen\n• `!status` — Status")
	return nil
}
