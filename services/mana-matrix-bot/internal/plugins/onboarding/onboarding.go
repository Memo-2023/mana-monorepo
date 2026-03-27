package onboarding

import (
	"context"
	"log/slog"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
)

func init() {
	plugin.Register("onboarding", func() plugin.Plugin { return &OnboardingPlugin{} })
}

type OnboardingPlugin struct {
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *OnboardingPlugin) Name() string { return "onboarding" }

func (p *OnboardingPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!start", p.cmdStart)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("onboarding plugin initialized")
	return nil
}

func (p *OnboardingPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!start"}, Description: "Onboarding starten", Category: "Onboarding"},
	}
}

func (p *OnboardingPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *OnboardingPlugin) cmdStart(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID,
		"**👋 Willkommen bei ManaCore!**\n\nIch helfe dir bei den ersten Schritten.\n\n1. Erstelle einen Account: `!register`\n2. Melde dich an: `!login email passwort`\n3. Erkunde die Apps!")
	return nil
}
func (p *OnboardingPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**Onboarding Bot:** ✅ Online")
	return nil
}
func (p *OnboardingPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**👋 Onboarding Bot**\n\n• `!start` — Onboarding starten\n• `!status` — Status")
	return nil
}
