package projectdoc

import (
	"context"
	"log/slog"

	"github.com/mana/mana-matrix-bot/internal/plugin"
	"github.com/mana/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("projectdoc", func() plugin.Plugin { return &ProjectDocPlugin{} })
}

type ProjectDocPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *ProjectDocPlugin) Name() string { return "projectdoc" }

func (p *ProjectDocPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!docs", p.cmdDocs)
	p.router.Handle("!generate", p.cmdGenerate)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("projectdoc plugin initialized")
	return nil
}

func (p *ProjectDocPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!docs"}, Description: "Dokumentation anzeigen", Category: "Docs"},
		{Patterns: []string{"!generate"}, Description: "Doku generieren", Category: "Docs"},
	}
}

func (p *ProjectDocPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *ProjectDocPlugin) cmdDocs(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**📄 Dokumentation**\n\n_Projekt-Dokumentation über die Web-App._")
	return nil
}
func (p *ProjectDocPlugin) cmdGenerate(mc *plugin.MessageContext, args string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**📄 Doku generieren**\n\n_Beschreibe das zu dokumentierende Projekt._")
	return nil
}
func (p *ProjectDocPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**ProjectDoc Bot:** ✅ Online")
	return nil
}
func (p *ProjectDocPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**📄 ProjectDoc Bot**\n\n• `!docs` — Dokumentation\n• `!generate` — Doku generieren\n• `!status` — Status")
	return nil
}
