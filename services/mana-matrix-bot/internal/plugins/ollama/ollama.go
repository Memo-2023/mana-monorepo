package ollama

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/mana/mana-matrix-bot/internal/plugin"
)

func init() {
	plugin.Register("ollama", func() plugin.Plugin { return &OllamaPlugin{} })
}

// ChatMessage represents a message in the chat history.
type ChatMessage struct {
	Role    string `json:"role"` // user, assistant, system
	Content string `json:"content"`
}

// OllamaModel represents an available model.
type OllamaModel struct {
	Name string `json:"name"`
	Size int64  `json:"size"`
}

// OllamaModelsResponse is the response from /api/tags.
type OllamaModelsResponse struct {
	Models []OllamaModel `json:"models"`
}

// OllamaChatRequest is the request body for /api/chat.
type OllamaChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

// OllamaChatResponse is the response from /api/chat.
type OllamaChatResponse struct {
	Message ChatMessage `json:"message"`
}

// UserSession holds per-user chat state.
type UserSession struct {
	Model   string
	History []ChatMessage
	Mode    string // default, code, translate, summarize
}

// OllamaPlugin implements the Matrix AI chat bot.
type OllamaPlugin struct {
	ollamaURL    string
	defaultModel string
	httpClient   *http.Client
	router       *plugin.CommandRouter
	detector     *plugin.KeywordDetector

	mu       sync.RWMutex
	sessions map[string]*UserSession
}

func (p *OllamaPlugin) Name() string { return "ollama" }

func (p *OllamaPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	p.ollamaURL = cfg.Extra["ollama_url"]
	if p.ollamaURL == "" {
		p.ollamaURL = "http://localhost:11434"
	}
	p.defaultModel = cfg.Extra["ollama_model"]
	if p.defaultModel == "" {
		p.defaultModel = "gemma3:4b"
	}

	p.httpClient = &http.Client{Timeout: 120 * time.Second}
	p.sessions = make(map[string]*UserSession)

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!models", p.cmdModels)
	p.router.Handle("!modelle", p.cmdModels)
	p.router.Handle("!model", p.cmdModel)
	p.router.Handle("!modell", p.cmdModel)
	p.router.Handle("!clear", p.cmdClear)
	p.router.Handle("!status", p.cmdStatus)
	p.router.Handle("!all", p.cmdAll)
	p.router.Handle("!mode", p.cmdMode)

	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"modelle", "welche modelle", "models"}, Command: "models"},
		plugin.KeywordCommand{Keywords: []string{"lösche verlauf", "neustart", "reset", "vergiss alles"}, Command: "clear"},
		plugin.KeywordCommand{Keywords: []string{"verbindung", "connection", "online"}, Command: "status"},
	))

	slog.Info("ollama plugin initialized", "url", p.ollamaURL, "model", p.defaultModel)
	return nil
}

func (p *OllamaPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!models", "!modelle"}, Description: "Verfügbare Modelle", Category: "AI"},
		{Patterns: []string{"!model [name]"}, Description: "Modell wechseln", Category: "AI"},
		{Patterns: []string{"!mode [name]"}, Description: "Modus ändern (default, code, translate)", Category: "AI"},
		{Patterns: []string{"!clear"}, Description: "Chat-Verlauf löschen", Category: "AI"},
		{Patterns: []string{"!all [frage]"}, Description: "Alle Modelle vergleichen", Category: "AI"},
		{Patterns: []string{"!status"}, Description: "Ollama-Status", Category: "System"},
	}
}

func (p *OllamaPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
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
	case "models":
		return p.cmdModels(mc, "")
	case "clear":
		return p.cmdClear(mc, "")
	case "status":
		return p.cmdStatus(mc, "")
	}

	// Default: treat as chat message
	return p.cmdChat(mc, mc.Body)
}

// --- Command Handlers ---

func (p *OllamaPlugin) cmdChat(mc *plugin.MessageContext, message string) error {
	ctx := context.Background()

	session := p.getSession(mc.Sender)

	// Build messages with history
	messages := make([]ChatMessage, 0, len(session.History)+2)

	// System prompt
	systemPrompt := getSystemPrompt(session.Mode)
	if systemPrompt != "" {
		messages = append(messages, ChatMessage{Role: "system", Content: systemPrompt})
	}

	// History
	messages = append(messages, session.History...)

	// New user message
	messages = append(messages, ChatMessage{Role: "user", Content: message})

	// Call Ollama
	response, err := p.chat(ctx, session.Model, messages)
	if err != nil {
		slog.Error("ollama chat failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Ollama ist nicht erreichbar.")
		return nil
	}

	// Update history (keep last 10 messages)
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

func (p *OllamaPlugin) cmdModels(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	models, err := p.listModels(ctx)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Modelle konnten nicht geladen werden.")
		return nil
	}

	if len(models) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Modelle verfügbar.")
		return nil
	}

	session := p.getSession(mc.Sender)

	var sb strings.Builder
	sb.WriteString("**Verfügbare Modelle:**\n\n")
	for _, m := range models {
		sizeMB := m.Size / (1024 * 1024)
		current := ""
		if m.Name == session.Model {
			current = " ✓"
		}
		sb.WriteString(fmt.Sprintf("• `%s` (%d MB)%s\n", m.Name, sizeMB, current))
	}
	sb.WriteString(fmt.Sprintf("\nWechseln mit: `!model [name]`"))

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *OllamaPlugin) cmdModel(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	if args == "" {
		session := p.getSession(mc.Sender)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("Aktuelles Modell: `%s`\n\nWechseln: `!model gemma3:4b`", session.Model))
		return nil
	}

	p.mu.Lock()
	session := p.getSession(mc.Sender)
	session.Model = args
	session.History = nil // Clear history on model switch
	p.sessions[mc.Sender] = session
	p.mu.Unlock()

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Modell gewechselt zu `%s`\nChat-Verlauf gelöscht.", args))
	return nil
}

func (p *OllamaPlugin) cmdMode(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	validModes := map[string]bool{"default": true, "code": true, "translate": true, "summarize": true}
	if args == "" || !validModes[args] {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "**Modi:** `default`, `code`, `translate`, `summarize`\n\nBeispiel: `!mode code`")
		return nil
	}

	p.mu.Lock()
	session := p.getSession(mc.Sender)
	session.Mode = args
	p.sessions[mc.Sender] = session
	p.mu.Unlock()

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ Modus gewechselt zu `%s`", args))
	return nil
}

func (p *OllamaPlugin) cmdClear(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	p.mu.Lock()
	session := p.getSession(mc.Sender)
	session.History = nil
	p.sessions[mc.Sender] = session
	p.mu.Unlock()

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "🗑️ Chat-Verlauf gelöscht.")
	return nil
}

func (p *OllamaPlugin) cmdAll(mc *plugin.MessageContext, question string) error {
	ctx := context.Background()

	if question == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte stelle eine Frage.\n\nBeispiel: `!all Was ist 2+2?`")
		return nil
	}

	models, err := p.listModels(ctx)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Modelle konnten nicht geladen werden.")
		return nil
	}

	// Send initial message
	initialMsg := fmt.Sprintf("**Modellvergleich**\n\n**Frage:** \"%s\"\n\n_Frage %d Modelle ab..._", question, len(models))
	eventID, _ := mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, initialMsg)

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**Modellvergleich**\n\n**Frage:** \"%s\"\n\n---\n", question))

	messages := []ChatMessage{{Role: "user", Content: question}}

	for _, m := range models {
		start := time.Now()
		response, err := p.chat(ctx, m.Name, messages)
		duration := time.Since(start)

		sb.WriteString(fmt.Sprintf("\n**%s** %.1fs\n", m.Name, duration.Seconds()))
		if err != nil {
			sb.WriteString("_Fehler_\n")
		} else {
			// Truncate long responses
			if len(response) > 500 {
				response = response[:500] + "..."
			}
			sb.WriteString(response)
			sb.WriteByte('\n')
		}
		sb.WriteString("\n---\n")
	}

	// Edit the initial message with results
	if eventID != "" {
		mc.Client.EditMessage(ctx, mc.RoomID, eventID, sb.String())
	} else {
		mc.Client.SendMessage(ctx, mc.RoomID, sb.String())
	}
	return nil
}

func (p *OllamaPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	session := p.getSession(mc.Sender)

	// Check connection
	connStatus := "❌ Offline"
	modelCount := 0
	models, err := p.listModels(ctx)
	if err == nil {
		connStatus = "✅ Online"
		modelCount = len(models)
	}

	response := fmt.Sprintf("**Ollama Status**\n\n**Verbindung:** %s\n**Modelle:** %d\n**Dein Modell:** `%s`\n**Chat-Verlauf:** %d Nachrichten\n**DSGVO:** Alle Daten lokal",
		connStatus, modelCount, session.Model, len(session.History))

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

func (p *OllamaPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**🤖 Ollama Bot - Befehle**

**Chat:**
Einfach eine Nachricht schreiben — der Bot antwortet mit KI.

**Modelle:**
• ` + "`!models`" + ` — Verfügbare Modelle
• ` + "`!model gemma3:4b`" + ` — Modell wechseln
• ` + "`!all Was ist 2+2?`" + ` — Alle Modelle vergleichen

**Modi:**
• ` + "`!mode code`" + ` — Code-Modus
• ` + "`!mode translate`" + ` — Übersetzer
• ` + "`!mode summarize`" + ` — Zusammenfasser

**System:**
• ` + "`!clear`" + ` — Chat-Verlauf löschen
• ` + "`!status`" + ` — Ollama-Status

Alle Daten bleiben lokal (DSGVO-konform).`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Ollama API ---

func (p *OllamaPlugin) chat(ctx context.Context, model string, messages []ChatMessage) (string, error) {
	body := OllamaChatRequest{
		Model:    model,
		Messages: messages,
		Stream:   false,
	}

	data, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", p.ollamaURL+"/api/chat", bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ollama error %d: %s", resp.StatusCode, string(respBody))
	}

	var result OllamaChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode ollama response: %w", err)
	}

	return result.Message.Content, nil
}

func (p *OllamaPlugin) listModels(ctx context.Context) ([]OllamaModel, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", p.ollamaURL+"/api/tags", nil)
	if err != nil {
		return nil, err
	}

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("list models: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("list models: %d", resp.StatusCode)
	}

	var result OllamaModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Models, nil
}

// --- Session Management ---

func (p *OllamaPlugin) getSession(userID string) *UserSession {
	p.mu.RLock()
	session, ok := p.sessions[userID]
	p.mu.RUnlock()

	if !ok {
		return &UserSession{
			Model: p.defaultModel,
			Mode:  "default",
		}
	}
	return session
}

// --- System Prompts ---

func getSystemPrompt(mode string) string {
	switch mode {
	case "code":
		return "Du bist ein erfahrener Programmierer. Antworte mit klaren Code-Beispielen und Erklärungen. Nutze Markdown-Codeblöcke."
	case "translate":
		return "Du bist ein Übersetzer. Übersetze den Text in die jeweils andere Sprache (Deutsch↔Englisch). Gib nur die Übersetzung zurück."
	case "summarize":
		return "Du bist ein Zusammenfasser. Fasse den Text kurz und prägnant zusammen. Nutze Stichpunkte wenn sinnvoll."
	default:
		return "Du bist ein hilfreicher KI-Assistent. Antworte auf Deutsch, außer der Nutzer schreibt auf Englisch."
	}
}
