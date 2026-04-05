package tts

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"sync"

	"github.com/mana/mana-matrix-bot/internal/plugin"
	"github.com/mana/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("tts", func() plugin.Plugin { return &TTSPlugin{} })
}

// UserSettings holds per-user TTS preferences.
type UserSettings struct {
	Voice string
	Speed float64
}

// TTSPlugin implements the Matrix text-to-speech bot.
type TTSPlugin struct {
	voice    *services.VoiceClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
	maxLen   int

	mu       sync.RWMutex
	settings map[string]*UserSettings
}

func (p *TTSPlugin) Name() string { return "tts" }

func (p *TTSPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	ttsURL := cfg.Extra["tts_url"]
	if ttsURL == "" {
		ttsURL = "http://localhost:3022"
	}

	p.voice = services.NewVoiceClient("", ttsURL)
	p.settings = make(map[string]*UserSettings)
	p.maxLen = 500

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!voice", p.cmdVoice)
	p.router.Handle("!stimme", p.cmdVoice)
	p.router.Handle("!voices", p.cmdVoices)
	p.router.Handle("!stimmen", p.cmdVoices)
	p.router.Handle("!speed", p.cmdSpeed)
	p.router.Handle("!geschwindigkeit", p.cmdSpeed)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"stimme", "stimme ändern"}, Command: "voice"},
		plugin.KeywordCommand{Keywords: []string{"stimmen", "verfügbare stimmen"}, Command: "voices"},
		plugin.KeywordCommand{Keywords: []string{"geschwindigkeit", "tempo"}, Command: "speed"},
	))

	slog.Info("tts plugin initialized", "url", ttsURL)
	return nil
}

func (p *TTSPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!voice [name]", "!stimme"}, Description: "Stimme ändern", Category: "Einstellungen"},
		{Patterns: []string{"!voices", "!stimmen"}, Description: "Verfügbare Stimmen", Category: "Einstellungen"},
		{Patterns: []string{"!speed [0.5-2.0]"}, Description: "Geschwindigkeit", Category: "Einstellungen"},
		{Patterns: []string{"!status"}, Description: "Aktuelle Einstellungen", Category: "System"},
	}
}

func (p *TTSPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	// Try command router first
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}

	// Try keywords
	cmd := p.detector.Detect(mc.Body)
	switch cmd {
	case "help":
		return p.cmdHelp(mc, "")
	case "voice":
		return p.cmdVoice(mc, "")
	case "voices":
		return p.cmdVoices(mc, "")
	case "speed":
		return p.cmdSpeed(mc, "")
	}

	// Default: treat as text to synthesize
	return p.synthesize(mc, mc.Body)
}

// --- Synthesis ---

func (p *TTSPlugin) synthesize(mc *plugin.MessageContext, text string) error {
	ctx := context.Background()

	if len(text) > p.maxLen {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
			fmt.Sprintf("❌ Text zu lang (%d Zeichen). Maximum: %d Zeichen.", len(text), p.maxLen))
		return nil
	}

	settings := p.getSettings(mc.Sender)

	audioData, err := p.voice.Synthesize(ctx, text, settings.Voice)
	if err != nil {
		slog.Error("tts synthesis failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Sprachsynthese fehlgeschlagen.")
		return nil
	}

	// Upload audio to Matrix
	mxcURL, err := mc.Client.UploadMedia(ctx, audioData, "audio/wav", "speech.wav")
	if err != nil {
		slog.Error("upload audio failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Audio-Upload fehlgeschlagen.")
		return nil
	}

	// Send audio message
	_, err = mc.Client.SendAudio(ctx, mc.RoomID, mxcURL, "speech.wav", len(audioData))
	if err != nil {
		slog.Error("send audio failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Audio konnte nicht gesendet werden.")
		return nil
	}

	return nil
}

// --- Command Handlers ---

func (p *TTSPlugin) cmdVoice(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	if args == "" {
		settings := p.getSettings(mc.Sender)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
			fmt.Sprintf("**Aktuelle Stimme:** `%s`\n\n**Verwendung:** `!voice [name]`\n\nZeige alle: `!voices`", settings.Voice))
		return nil
	}

	p.mu.Lock()
	settings := p.getSettings(mc.Sender)
	settings.Voice = args
	p.settings[mc.Sender] = settings
	p.mu.Unlock()

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Stimme auf `%s` gesetzt.", args))
	return nil
}

func (p *TTSPlugin) cmdVoices(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	// Known voices (static list — the TTS service auto-discovers)
	help := `**Verfügbare Stimmen:**

**Kokoro (Englisch, schnell):**
• ` + "`af_heart`" + ` — Weiblich (Standard)
• ` + "`af_bella`" + ` — Weiblich
• ` + "`am_michael`" + ` — Männlich
• ` + "`bm_daniel`" + ` — Männlich
• ` + "`bf_emma`" + ` — Weiblich

**Piper (Deutsch, lokal):**
• ` + "`de_kerstin`" + ` — Deutsch Frau
• ` + "`de_thorsten`" + ` — Deutsch Mann

Wechseln mit: ` + "`!voice [name]`"

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

func (p *TTSPlugin) cmdSpeed(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	if args == "" {
		settings := p.getSettings(mc.Sender)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
			fmt.Sprintf("**Aktuelle Geschwindigkeit:** %.1fx\n\n**Verwendung:** `!speed [0.5-2.0]`", settings.Speed))
		return nil
	}

	speed, err := strconv.ParseFloat(args, 64)
	if err != nil || speed < 0.5 || speed > 2.0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Geschwindigkeit muss zwischen 0.5 und 2.0 liegen.\n\nBeispiel: `!speed 1.2`")
		return nil
	}

	p.mu.Lock()
	settings := p.getSettings(mc.Sender)
	settings.Speed = speed
	p.settings[mc.Sender] = settings
	p.mu.Unlock()

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Geschwindigkeit auf %.1fx gesetzt.", speed))
	return nil
}

func (p *TTSPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	settings := p.getSettings(mc.Sender)

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
		fmt.Sprintf("**Aktuelle Einstellungen:**\n\nStimme: `%s`\nGeschwindigkeit: %.1fx\nMax. Textlänge: %d Zeichen",
			settings.Voice, settings.Speed, p.maxLen))
	return nil
}

func (p *TTSPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**🔊 TTS Bot - Text zu Sprache**

Sende eine **Textnachricht** und ich lese sie vor!

**Einstellungen:**
• ` + "`!voice af_heart`" + ` — Stimme wechseln
• ` + "`!voices`" + ` — Alle Stimmen anzeigen
• ` + "`!speed 1.2`" + ` — Geschwindigkeit (0.5-2.0)
• ` + "`!status`" + ` — Aktuelle Einstellungen

**Max. Textlänge:** 500 Zeichen`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Settings ---

func (p *TTSPlugin) getSettings(userID string) *UserSettings {
	p.mu.RLock()
	settings, ok := p.settings[userID]
	p.mu.RUnlock()

	if !ok {
		return &UserSettings{
			Voice: "af_heart",
			Speed: 1.0,
		}
	}
	return settings
}
