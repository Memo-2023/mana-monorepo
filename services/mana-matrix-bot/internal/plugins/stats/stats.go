package stats

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/mana/mana-matrix-bot/internal/plugin"
	"github.com/mana/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("stats", func() plugin.Plugin { return &StatsPlugin{} })
}

// StatsPlugin reports system statistics via Matrix.
type StatsPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *StatsPlugin) Name() string { return "stats" }

func (p *StatsPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!stats", p.cmdStats)
	p.router.Handle("!report", p.cmdStats)
	p.router.Handle("!bericht", p.cmdStats)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)

	slog.Info("stats plugin initialized")
	return nil
}

func (p *StatsPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!stats", "!report"}, Description: "Systemstatistiken", Category: "Stats"},
		{Patterns: []string{"!status"}, Description: "Bot-Status", Category: "System"},
	}
}

func (p *StatsPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	cmd := p.detector.Detect(mc.Body)
	if cmd == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *StatsPlugin) cmdStats(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "**📊 Systemstatistiken**\n\n_Verfügbar wenn VictoriaMetrics verbunden._")
	return nil
}

func (p *StatsPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "**Stats Bot:** ✅ Online")
	return nil
}

func (p *StatsPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("**📊 Stats Bot**\n\n• `!stats` — Systemstatistiken\n• `!status` — Bot-Status"))
	return nil
}
