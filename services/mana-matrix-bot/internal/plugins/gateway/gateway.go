package gateway

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("gateway", func() plugin.Plugin { return &GatewayPlugin{} })
}

// GatewayPlugin is the composite mana-bot that combines AI chat, todo,
// calendar, clock, and voice into a single bot identity.
type GatewayPlugin struct {
	// Sub-handler clients
	todoBackend     *services.BackendClient
	calendarBackend *services.BackendClient
	clockBackend    *services.BackendClient
	voice           *services.VoiceClient

	// AI chat
	ollamaURL    string
	defaultModel string

	// Command infrastructure
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector

	// Per-user AI sessions
	mu       sync.RWMutex
	sessions map[string]*AISession
}

// AISession holds per-user AI chat state.
type AISession struct {
	Model   string
	Mode    string
	History []ChatMessage
}

// ChatMessage for Ollama API.
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func (p *GatewayPlugin) Name() string { return "gateway" }

func (p *GatewayPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	p.sessions = make(map[string]*AISession)

	// Ollama config
	p.ollamaURL = cfg.Extra["ollama_url"]
	if p.ollamaURL == "" {
		p.ollamaURL = "http://localhost:11434"
	}
	p.defaultModel = cfg.Extra["ollama_model"]
	if p.defaultModel == "" {
		p.defaultModel = "gemma3:4b"
	}

	// Backend clients (optional — gateway works even without backends)
	if url := cfg.Extra["todo_url"]; url != "" {
		p.todoBackend = services.NewBackendClient(url)
	}
	if url := cfg.Extra["calendar_url"]; url != "" {
		p.calendarBackend = services.NewBackendClient(url)
	}
	if url := cfg.Extra["clock_url"]; url != "" {
		p.clockBackend = services.NewBackendClient(url)
	}

	// Voice
	sttURL := cfg.Extra["stt_url"]
	ttsURL := cfg.Extra["tts_url"]
	if sttURL != "" || ttsURL != "" {
		p.voice = services.NewVoiceClient(sttURL, ttsURL)
	}

	// Build command router with all sub-handler commands
	p.router = plugin.NewCommandRouter()

	// Help
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)

	// AI
	p.router.Handle("!models", p.cmdModels)
	p.router.Handle("!modelle", p.cmdModels)
	p.router.Handle("!model", p.cmdModel)
	p.router.Handle("!clear", p.cmdClear)
	p.router.Handle("!all", p.cmdAll)
	p.router.Handle("!mode", p.cmdMode)

	// Todo
	p.router.Handle("!todo", p.cmdTodoAdd)
	p.router.Handle("!add", p.cmdTodoAdd)
	p.router.Handle("!list", p.cmdTodoList)
	p.router.Handle("!liste", p.cmdTodoList)
	p.router.Handle("!done", p.cmdTodoDone)
	p.router.Handle("!erledigt", p.cmdTodoDone)

	// Calendar
	p.router.Handle("!cal", p.cmdCalToday)
	p.router.Handle("!heute", p.cmdCalToday)
	p.router.Handle("!week", p.cmdCalWeek)
	p.router.Handle("!woche", p.cmdCalWeek)
	p.router.Handle("!termin", p.cmdCalCreate)

	// Clock
	p.router.Handle("!timer", p.cmdTimer)
	p.router.Handle("!timers", p.cmdTimers)
	p.router.Handle("!stop", p.cmdTimerStop)
	p.router.Handle("!zeit", p.cmdTime)
	p.router.Handle("!time", p.cmdTime)

	// Morning summary
	p.router.Handle("!morning", p.cmdMorning)
	p.router.Handle("!guten morgen", p.cmdMorning)

	// Status
	p.router.Handle("!status", p.cmdStatus)

	// Keyword detector
	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"meine aufgaben", "show tasks"}, Command: "list"},
		plugin.KeywordCommand{Keywords: []string{"modelle", "welche modelle"}, Command: "models"},
		plugin.KeywordCommand{Keywords: []string{"guten morgen", "good morning"}, Command: "morning"},
		plugin.KeywordCommand{Keywords: []string{"wie spät", "uhrzeit"}, Command: "time"},
		plugin.KeywordCommand{Keywords: []string{"lösche verlauf", "vergiss alles"}, Command: "clear"},
	))

	slog.Info("gateway plugin initialized", "ollama", p.ollamaURL, "model", p.defaultModel)
	return nil
}

func (p *GatewayPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!todo [text]"}, Description: "Aufgabe erstellen", Category: "Aufgaben"},
		{Patterns: []string{"!list"}, Description: "Offene Aufgaben", Category: "Aufgaben"},
		{Patterns: []string{"!done [nr]"}, Description: "Aufgabe erledigen", Category: "Aufgaben"},
		{Patterns: []string{"!cal", "!heute"}, Description: "Heutige Termine", Category: "Kalender"},
		{Patterns: []string{"!week", "!woche"}, Description: "Wochenübersicht", Category: "Kalender"},
		{Patterns: []string{"!timer [dauer]"}, Description: "Timer starten", Category: "Timer"},
		{Patterns: []string{"!models"}, Description: "KI-Modelle", Category: "AI"},
		{Patterns: []string{"!model [name]"}, Description: "Modell wechseln", Category: "AI"},
		{Patterns: []string{"!morning"}, Description: "Morgenzusammenfassung", Category: "System"},
	}
}

func (p *GatewayPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	// Try command router
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}

	// Try keywords
	cmd := p.detector.Detect(mc.Body)
	switch cmd {
	case "help":
		return p.cmdHelp(mc, "")
	case "list":
		return p.cmdTodoList(mc, "")
	case "models":
		return p.cmdModels(mc, "")
	case "morning":
		return p.cmdMorning(mc, "")
	case "time":
		return p.cmdTime(mc, "")
	case "clear":
		return p.cmdClear(mc, "")
	}

	// Default: AI chat
	return p.cmdChat(mc, mc.Body)
}

// HandleAudioMessage transcribes audio then routes the text.
func (p *GatewayPlugin) HandleAudioMessage(ctx context.Context, mc *plugin.MessageContext, audioData []byte) error {
	if p.voice == nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Spracherkennung nicht konfiguriert.")
		return nil
	}

	result, err := p.voice.Transcribe(ctx, audioData, "de")
	if err != nil {
		slog.Error("transcription failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Spracherkennung fehlgeschlagen.")
		return nil
	}

	text := strings.TrimSpace(result.Text)
	if text == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "🎤 Ich konnte nichts verstehen.")
		return nil
	}

	// Show transcription
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("🎤 *\"%s\"*", text))

	// Route transcribed text as if it were a text message
	mc.Body = text
	mc.IsVoice = true
	return p.HandleTextMessage(ctx, mc)
}

// --- AI Sub-Handler ---

func (p *GatewayPlugin) cmdChat(mc *plugin.MessageContext, message string) error {
	ctx := context.Background()
	session := p.getAISession(mc.Sender)

	messages := buildMessages(session, message)

	response, err := ollamaChat(ctx, p.ollamaURL, session.Model, messages)
	if err != nil {
		slog.Error("ollama chat failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ KI ist nicht erreichbar.")
		return nil
	}

	// Update history
	session.History = append(session.History, ChatMessage{Role: "user", Content: message})
	session.History = append(session.History, ChatMessage{Role: "assistant", Content: response})
	if len(session.History) > 20 {
		session.History = session.History[len(session.History)-20:]
	}
	p.mu.Lock()
	p.sessions[mc.Sender] = session
	p.mu.Unlock()

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

func (p *GatewayPlugin) cmdModels(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	models, err := ollamaListModels(ctx, p.ollamaURL)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Modelle konnten nicht geladen werden.")
		return nil
	}
	session := p.getAISession(mc.Sender)
	var sb strings.Builder
	sb.WriteString("**Verfügbare Modelle:**\n\n")
	for _, m := range models {
		current := ""
		if m.Name == session.Model {
			current = " ✓"
		}
		sb.WriteString(fmt.Sprintf("• `%s` (%d MB)%s\n", m.Name, m.Size/(1024*1024), current))
	}
	sb.WriteString("\nWechseln: `!model [name]`")
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *GatewayPlugin) cmdModel(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	if args == "" {
		s := p.getAISession(mc.Sender)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("Aktuelles Modell: `%s`", s.Model))
		return nil
	}
	p.mu.Lock()
	s := p.getAISession(mc.Sender)
	s.Model = args
	s.History = nil
	p.sessions[mc.Sender] = s
	p.mu.Unlock()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Modell: `%s` — Verlauf gelöscht.", args))
	return nil
}

func (p *GatewayPlugin) cmdMode(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	valid := map[string]bool{"default": true, "code": true, "translate": true, "summarize": true}
	if !valid[args] {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "**Modi:** `default`, `code`, `translate`, `summarize`")
		return nil
	}
	p.mu.Lock()
	s := p.getAISession(mc.Sender)
	s.Mode = args
	p.sessions[mc.Sender] = s
	p.mu.Unlock()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Modus: `%s`", args))
	return nil
}

func (p *GatewayPlugin) cmdClear(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	p.mu.Lock()
	s := p.getAISession(mc.Sender)
	s.History = nil
	p.sessions[mc.Sender] = s
	p.mu.Unlock()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "🗑️ Chat-Verlauf gelöscht.")
	return nil
}

func (p *GatewayPlugin) cmdAll(mc *plugin.MessageContext, question string) error {
	ctx := context.Background()
	if question == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Beispiel: `!all Was ist 2+2?`")
		return nil
	}
	models, err := ollamaListModels(ctx, p.ollamaURL)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Modelle nicht erreichbar.")
		return nil
	}
	eventID, _ := mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("**Vergleich:** \"%s\" — %d Modelle...", question, len(models)))

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**Modellvergleich:** \"%s\"\n\n---\n", question))
	msgs := []ChatMessage{{Role: "user", Content: question}}
	for _, m := range models {
		start := time.Now()
		resp, err := ollamaChat(ctx, p.ollamaURL, m.Name, msgs)
		dur := time.Since(start)
		sb.WriteString(fmt.Sprintf("\n**%s** %.1fs\n", m.Name, dur.Seconds()))
		if err != nil {
			sb.WriteString("_Fehler_\n")
		} else {
			if len(resp) > 500 {
				resp = resp[:500] + "..."
			}
			sb.WriteString(resp + "\n")
		}
		sb.WriteString("\n---\n")
	}
	if eventID != "" {
		mc.Client.EditMessage(ctx, mc.RoomID, eventID, sb.String())
	}
	return nil
}

// --- Todo Sub-Handler ---

func (p *GatewayPlugin) cmdTodoAdd(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	if p.todoBackend == nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Todo-Backend nicht konfiguriert.")
		return nil
	}
	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Beispiel: `!todo Einkaufen @morgen !p1`")
		return nil
	}
	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte zuerst anmelden: `!login email passwort`")
		return nil
	}
	body := map[string]string{"title": args}
	var task struct{ Title string `json:"title"` }
	if err := p.todoBackend.Post(ctx, "/api/tasks", token, body, &task); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgabe konnte nicht erstellt werden.")
		return nil
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ **%s**", task.Title))
	return nil
}

func (p *GatewayPlugin) cmdTodoList(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	if p.todoBackend == nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Todo-Backend nicht konfiguriert.")
		return nil
	}
	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte zuerst anmelden: `!login email passwort`")
		return nil
	}
	var tasks []struct {
		Title    string `json:"title"`
		Priority int    `json:"priority"`
	}
	if err := p.todoBackend.Get(ctx, "/api/tasks?completed=false", token, &tasks); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgaben konnten nicht geladen werden.")
		return nil
	}
	if len(tasks) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine offenen Aufgaben.")
		return nil
	}
	var sb strings.Builder
	sb.WriteString("📋 **Aufgaben:**\n\n")
	for i, t := range tasks {
		sb.WriteString(fmt.Sprintf("**%d.** %s\n", i+1, t.Title))
	}
	sb.WriteString("\nErledigen: `!done [Nr]`")
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *GatewayPlugin) cmdTodoDone(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "✅ Aufgabe erledigt. (Nutze den Todo-Bot für vollständige Funktionalität)")
	return nil
}

// --- Calendar Sub-Handler ---

func (p *GatewayPlugin) cmdCalToday(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	if p.calendarBackend == nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kalender-Backend nicht konfiguriert.")
		return nil
	}
	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte zuerst anmelden.")
		return nil
	}
	var events []struct {
		Title     string `json:"title"`
		StartTime string `json:"startTime"`
	}
	if err := p.calendarBackend.Get(ctx, "/api/events/today", token, &events); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Termine konnten nicht geladen werden.")
		return nil
	}
	if len(events) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Termine heute.")
		return nil
	}
	var sb strings.Builder
	sb.WriteString("📅 **Heute:**\n\n")
	for i, e := range events {
		sb.WriteString(fmt.Sprintf("**%d.** %s\n", i+1, e.Title))
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *GatewayPlugin) cmdCalWeek(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📅 Nutze den Kalender-Bot für die Wochenübersicht.")
	return nil
}

func (p *GatewayPlugin) cmdCalCreate(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📅 Nutze den Kalender-Bot: `!termin Meeting morgen um 14:00`")
	return nil
}

// --- Clock Sub-Handler ---

func (p *GatewayPlugin) cmdTimer(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "⏱️ Nutze den Clock-Bot für Timer: `!timer 25m`")
	return nil
}

func (p *GatewayPlugin) cmdTimers(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "⏱️ Nutze den Clock-Bot: `!timers`")
	return nil
}

func (p *GatewayPlugin) cmdTimerStop(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "⏸️ Nutze den Clock-Bot: `!stop`")
	return nil
}

func (p *GatewayPlugin) cmdTime(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	now := time.Now()
	days := []string{"Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
		fmt.Sprintf("**%s Uhr** — %s, %d.%d.%d", now.Format("15:04"), days[now.Weekday()], now.Day(), now.Month(), now.Year()))
	return nil
}

// --- Morning Summary ---

func (p *GatewayPlugin) cmdMorning(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	var sb strings.Builder
	sb.WriteString("**☀️ Guten Morgen!**\n\n")

	now := time.Now()
	days := []string{"Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"}
	months := []string{"", "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"}
	sb.WriteString(fmt.Sprintf("📅 %s, %d. %s %d\n\n", days[now.Weekday()], now.Day(), months[now.Month()], now.Year()))

	// Try to fetch today's tasks
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)
	if p.todoBackend != nil && token != "" {
		var tasks []struct{ Title string `json:"title"` }
		if err := p.todoBackend.Get(ctx, "/api/tasks?completed=false", token, &tasks); err == nil && len(tasks) > 0 {
			sb.WriteString(fmt.Sprintf("📋 **%d offene Aufgaben**\n", len(tasks)))
		}
	}

	// Try to fetch today's events
	if p.calendarBackend != nil && token != "" {
		var events []struct{ Title string `json:"title"` }
		if err := p.calendarBackend.Get(ctx, "/api/events/today", token, &events); err == nil && len(events) > 0 {
			sb.WriteString(fmt.Sprintf("📅 **%d Termine heute**\n", len(events)))
		}
	}

	sb.WriteString("\nSchönen Tag! 🌟")
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

// --- Status & Help ---

func (p *GatewayPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	session := p.getAISession(mc.Sender)

	var sb strings.Builder
	sb.WriteString("**🤖 Mana Bot Status**\n\n")
	sb.WriteString(fmt.Sprintf("**KI-Modell:** `%s`\n", session.Model))
	sb.WriteString(fmt.Sprintf("**Chat-Verlauf:** %d Nachrichten\n", len(session.History)))
	sb.WriteString(fmt.Sprintf("**Modus:** `%s`\n", session.Mode))

	loggedIn := mc.Session.Manager.IsLoggedIn(mc.Session.UserID)
	if loggedIn {
		sb.WriteString("**Auth:** ✅ Angemeldet\n")
	} else {
		sb.WriteString("**Auth:** ❌ Nicht angemeldet\n")
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *GatewayPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**🤖 Mana Bot — Befehle**

**KI Chat:**
Einfach eine Nachricht schreiben!
• ` + "`!models`" + ` — Modelle | ` + "`!model [name]`" + ` — Wechseln
• ` + "`!all [frage]`" + ` — Alle Modelle vergleichen
• ` + "`!clear`" + ` — Verlauf löschen

**Aufgaben:**
• ` + "`!todo Einkaufen`" + ` — Neue Aufgabe
• ` + "`!list`" + ` — Offene Aufgaben | ` + "`!done 1`" + ` — Erledigen

**Kalender:**
• ` + "`!heute`" + ` — Heutige Termine

**Uhr:**
• ` + "`!zeit`" + ` — Aktuelle Uhrzeit

**System:**
• ` + "`!morning`" + ` — Morgenzusammenfassung
• ` + "`!status`" + ` — Bot-Status

🎤 Sprachnachrichten werden automatisch verarbeitet.`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- AI Session ---

func (p *GatewayPlugin) getAISession(userID string) *AISession {
	p.mu.RLock()
	s, ok := p.sessions[userID]
	p.mu.RUnlock()
	if !ok {
		return &AISession{Model: p.defaultModel, Mode: "default"}
	}
	return s
}
