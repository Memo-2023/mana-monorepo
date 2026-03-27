package picture

import (
	"context"
	"log/slog"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("picture", func() plugin.Plugin { return &PicturePlugin{} })
}

type PicturePlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *PicturePlugin) Name() string { return "picture" }

func (p *PicturePlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL != "" {
		p.backend = services.NewBackendClient(cfg.BackendURL)
	}
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!generate", p.cmdGenerate)
	p.router.Handle("!generiere", p.cmdGenerate)
	p.router.Handle("!bild", p.cmdGenerate)
	p.router.Handle("!gallery", p.cmdGallery)
	p.router.Handle("!galerie", p.cmdGallery)
	p.router.Handle("!status", p.cmdStatus)
	p.detector = plugin.NewKeywordDetector(plugin.CommonKeywords)
	slog.Info("picture plugin initialized")
	return nil
}

func (p *PicturePlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!generate", "!bild"}, Description: "Bild generieren", Category: "Bilder"},
		{Patterns: []string{"!gallery", "!galerie"}, Description: "Galerie anzeigen", Category: "Bilder"},
	}
}

func (p *PicturePlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}
	if p.detector.Detect(mc.Body) == "help" {
		return p.cmdHelp(mc, "")
	}
	return nil
}

func (p *PicturePlugin) cmdGenerate(mc *plugin.MessageContext, args string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🎨 Bildgenerierung**\n\n_Beschreibe das gewünschte Bild._")
	return nil
}
func (p *PicturePlugin) cmdGallery(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🖼️ Galerie**\n\n_Verfügbar über die Web-App._")
	return nil
}
func (p *PicturePlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**Picture Bot:** ✅ Online")
	return nil
}
func (p *PicturePlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	mc.Client.SendReply(context.Background(), mc.RoomID, mc.EventID, "**🎨 Picture Bot**\n\n• `!bild [beschreibung]` — Bild generieren\n• `!galerie` — Galerie\n• `!status` — Status")
	return nil
}
