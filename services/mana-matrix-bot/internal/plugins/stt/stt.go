package stt

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"sync"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("stt", func() plugin.Plugin { return &STTPlugin{} })
}

// UserSettings holds per-user STT preferences.
type UserSettings struct {
	Language string // de, en, auto
	Model    string // whisper, voxtral, auto
}

// STTPlugin implements the Matrix speech-to-text bot.
type STTPlugin struct {
	voice    *services.VoiceClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector

	mu       sync.RWMutex
	settings map[string]*UserSettings
}

func (p *STTPlugin) Name() string { return "stt" }

func (p *STTPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	sttURL := cfg.Extra["stt_url"]
	if sttURL == "" {
		sttURL = "http://localhost:3020"
	}

	p.voice = services.NewVoiceClient(sttURL, "")
	p.settings = make(map[string]*UserSettings)

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!language", p.cmdLanguage)
	p.router.Handle("!sprache", p.cmdLanguage)
	p.router.Handle("!model", p.cmdModel)
	p.router.Handle("!modell", p.cmdModel)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"sprache", "sprache ändern"}, Command: "language"},
		plugin.KeywordCommand{Keywords: []string{"modell"}, Command: "model"},
	))

	slog.Info("stt plugin initialized", "url", sttURL)
	return nil
}

func (p *STTPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!language [de|en|auto]"}, Description: "Sprache ändern", Category: "Einstellungen"},
		{Patterns: []string{"!model [whisper|voxtral]"}, Description: "STT-Modell ändern", Category: "Einstellungen"},
		{Patterns: []string{"!status"}, Description: "Aktuelle Einstellungen", Category: "System"},
	}
}

func (p *STTPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}

	cmd := p.detector.Detect(mc.Body)
	switch cmd {
	case "help":
		return p.cmdHelp(mc, "")
	case "language":
		return p.cmdLanguage(mc, "")
	case "model":
		return p.cmdModel(mc, "")
	}

	// STT bot only responds to commands and audio — ignore other text
	return nil
}

// HandleAudioMessage transcribes audio messages.
func (p *STTPlugin) HandleAudioMessage(ctx context.Context, mc *plugin.MessageContext, audioData []byte) error {
	settings := p.getSettings(mc.Sender)

	result, err := p.voice.Transcribe(ctx, audioData, settings.Language)
	if err != nil {
		slog.Error("transcription failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Transkription fehlgeschlagen.")
		return nil
	}

	if strings.TrimSpace(result.Text) == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "🎤 Ich konnte nichts verstehen.")
		return nil
	}

	response := fmt.Sprintf("**Transkription:**\n\n%s\n\n*Sprache: %s | Dauer: %.1fs*",
		result.Text, result.Language, result.Duration)

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

// --- Command Handlers ---

func (p *STTPlugin) cmdLanguage(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	validLangs := map[string]bool{"de": true, "en": true, "auto": true}
	if args == "" || !validLangs[args] {
		settings := p.getSettings(mc.Sender)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
			fmt.Sprintf("**Aktuelle Sprache:** `%s`\n\n**Verwendung:** `!language [de|en|auto]`", settings.Language))
		return nil
	}

	p.mu.Lock()
	settings := p.getSettings(mc.Sender)
	settings.Language = args
	p.settings[mc.Sender] = settings
	p.mu.Unlock()

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Sprache auf `%s` gesetzt.", args))
	return nil
}

func (p *STTPlugin) cmdModel(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	validModels := map[string]bool{"whisper": true, "voxtral": true, "auto": true}
	if args == "" || !validModels[args] {
		settings := p.getSettings(mc.Sender)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
			fmt.Sprintf("**Aktuelles Modell:** `%s`\n\n**Verwendung:** `!model [whisper|voxtral|auto]`\n\n**Modelle:**\n• `whisper` — Whisper Large V3 (lokal, schnell)\n• `voxtral` — Voxtral Mini (Cloud, Speaker Diarization)\n• `auto` — Automatische Auswahl", settings.Model))
		return nil
	}

	p.mu.Lock()
	settings := p.getSettings(mc.Sender)
	settings.Model = args
	p.settings[mc.Sender] = settings
	p.mu.Unlock()

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Modell auf `%s` gesetzt.", args))
	return nil
}

func (p *STTPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	settings := p.getSettings(mc.Sender)

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
		fmt.Sprintf("**Aktuelle Einstellungen:**\n\nSprache: `%s`\nModell: `%s`", settings.Language, settings.Model))
	return nil
}

func (p *STTPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**🎤 STT Bot - Sprache zu Text**

Sende eine **Sprachnachricht** und ich transkribiere sie!

**Einstellungen:**
• ` + "`!language de`" + ` — Sprache (de, en, auto)
• ` + "`!model whisper`" + ` — Modell (whisper, voxtral, auto)
• ` + "`!status`" + ` — Aktuelle Einstellungen

**Modelle:**
• **Whisper** — Lokal, schnell, gut für Deutsch/Englisch
• **Voxtral** — Cloud, Speaker Diarization`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Settings ---

func (p *STTPlugin) getSettings(userID string) *UserSettings {
	p.mu.RLock()
	settings, ok := p.settings[userID]
	p.mu.RUnlock()

	if !ok {
		return &UserSettings{
			Language: "de",
			Model:    "whisper",
		}
	}
	return settings
}
