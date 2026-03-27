package zitare

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("zitare", func() plugin.Plugin { return &ZitarePlugin{} })
}

// Quote represents a quote from the backend.
type Quote struct {
	ID       string `json:"id"`
	Text     string `json:"text"`
	Author   string `json:"author"`
	Category string `json:"category"`
}

// Category represents a quote category.
type Category struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// ZitarePlugin implements the Matrix quotes bot.
type ZitarePlugin struct {
	backend   *services.BackendClient
	router    *plugin.CommandRouter
	detector  *plugin.KeywordDetector
	lastQuote map[string]*Quote // per-user last shown quote
}

func (p *ZitarePlugin) Name() string { return "zitare" }

func (p *ZitarePlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL == "" {
		return fmt.Errorf("zitare plugin requires BackendURL")
	}
	p.backend = services.NewBackendClient(cfg.BackendURL)
	p.lastQuote = make(map[string]*Quote)

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!zitat", p.cmdRandom)
	p.router.Handle("!quote", p.cmdRandom)
	p.router.Handle("!heute", p.cmdToday)
	p.router.Handle("!today", p.cmdToday)
	p.router.Handle("!suche", p.cmdSearch)
	p.router.Handle("!search", p.cmdSearch)
	p.router.Handle("!kategorie", p.cmdCategory)
	p.router.Handle("!category", p.cmdCategory)
	p.router.Handle("!kategorien", p.cmdCategories)
	p.router.Handle("!categories", p.cmdCategories)
	p.router.Handle("!motivation", p.cmdMotivation)
	p.router.Handle("!morgen", p.cmdMorning)
	p.router.Handle("!favorit", p.cmdFavorite)
	p.router.Handle("!fav", p.cmdFavorite)
	p.router.Handle("!favoriten", p.cmdFavorites)
	p.router.Handle("!favorites", p.cmdFavorites)
	p.router.Handle("!listen", p.cmdLists)
	p.router.Handle("!lists", p.cmdLists)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"zitat", "quote", "inspiration", "inspiriere"}, Command: "random"},
		plugin.KeywordCommand{Keywords: []string{"tageszitat"}, Command: "today"},
		plugin.KeywordCommand{Keywords: []string{"motiviere", "motivation", "motivier mich"}, Command: "motivation"},
		plugin.KeywordCommand{Keywords: []string{"guten morgen", "good morning"}, Command: "morning"},
		plugin.KeywordCommand{Keywords: []string{"kategorien", "categories", "themen"}, Command: "categories"},
		plugin.KeywordCommand{Keywords: []string{"favoriten", "favorites", "meine favoriten"}, Command: "favorites"},
		plugin.KeywordCommand{Keywords: []string{"listen", "lists", "meine listen"}, Command: "lists"},
	))

	slog.Info("zitare plugin initialized", "backend", cfg.BackendURL)
	return nil
}

func (p *ZitarePlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!zitat", "!quote"}, Description: "Zufälliges Zitat", Category: "Zitate"},
		{Patterns: []string{"!heute", "!today"}, Description: "Zitat des Tages", Category: "Zitate"},
		{Patterns: []string{"!suche [text]"}, Description: "Zitate suchen", Category: "Zitate"},
		{Patterns: []string{"!kategorie [name]"}, Description: "Zitat aus Kategorie", Category: "Zitate"},
		{Patterns: []string{"!kategorien"}, Description: "Alle Kategorien", Category: "Zitate"},
		{Patterns: []string{"!motivation"}, Description: "Motivationszitat", Category: "Zitate"},
		{Patterns: []string{"!favorit"}, Description: "Letztes Zitat als Favorit", Category: "Zitate"},
		{Patterns: []string{"!favoriten"}, Description: "Alle Favoriten", Category: "Zitate"},
	}
}

func (p *ZitarePlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}

	cmd := p.detector.Detect(mc.Body)
	switch cmd {
	case "help":
		return p.cmdHelp(mc, "")
	case "random":
		return p.cmdRandom(mc, "")
	case "today":
		return p.cmdToday(mc, "")
	case "motivation":
		return p.cmdMotivation(mc, "")
	case "morning":
		return p.cmdMorning(mc, "")
	case "categories":
		return p.cmdCategories(mc, "")
	case "favorites":
		return p.cmdFavorites(mc, "")
	case "lists":
		return p.cmdLists(mc, "")
	}

	return nil
}

// --- Command Handlers ---

func (p *ZitarePlugin) cmdRandom(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var quote Quote
	if err := p.backend.Get(ctx, "/api/v1/quotes/random", token, &quote); err != nil {
		slog.Error("get random quote failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Zitat konnte nicht geladen werden.")
		return nil
	}

	p.lastQuote[mc.Sender] = &quote
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatQuote(&quote))
	return nil
}

func (p *ZitarePlugin) cmdToday(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var quote Quote
	if err := p.backend.Get(ctx, "/api/v1/quotes/today", token, &quote); err != nil {
		slog.Error("get today quote failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Zitat des Tages konnte nicht geladen werden.")
		return nil
	}

	p.lastQuote[mc.Sender] = &quote
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatQuote(&quote))
	return nil
}

func (p *ZitarePlugin) cmdSearch(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib einen Suchbegriff an.\n\nBeispiel: `!suche Glück`")
		return nil
	}

	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var quotes []Quote
	if err := p.backend.Get(ctx, "/api/v1/quotes/search?q="+args, token, &quotes); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Suche fehlgeschlagen.")
		return nil
	}

	if len(quotes) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("📭 Keine Zitate für \"%s\" gefunden.", args))
		return nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**Suchergebnisse für \"%s\" (%d):**\n\n", args, len(quotes)))

	limit := len(quotes)
	if limit > 5 {
		limit = 5
	}
	for i := 0; i < limit; i++ {
		q := quotes[i]
		sb.WriteString(fmt.Sprintf("**%d.** \"%s\"\n-- *%s*\n\n", i+1, q.Text, q.Author))
	}
	if len(quotes) > 5 {
		sb.WriteString(fmt.Sprintf("_...und %d weitere_", len(quotes)-5))
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *ZitarePlugin) cmdCategory(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine Kategorie an.\n\nBeispiel: `!kategorie motivation`\nAlle Kategorien: `!kategorien`")
		return nil
	}

	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var quote Quote
	if err := p.backend.Get(ctx, "/api/v1/quotes/random?category="+args, token, &quote); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("❌ Kein Zitat in Kategorie \"%s\" gefunden.", args))
		return nil
	}

	p.lastQuote[mc.Sender] = &quote
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatQuote(&quote))
	return nil
}

func (p *ZitarePlugin) cmdCategories(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var categories []Category
	if err := p.backend.Get(ctx, "/api/v1/quotes/categories", token, &categories); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kategorien konnten nicht geladen werden.")
		return nil
	}

	if len(categories) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Kategorien verfügbar.")
		return nil
	}

	var sb strings.Builder
	sb.WriteString("**Verfügbare Kategorien:**\n\n")
	for _, cat := range categories {
		sb.WriteString(fmt.Sprintf("• **%s** (`!kategorie %s`) - %d Zitate\n", cat.Name, strings.ToLower(cat.Name), cat.Count))
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *ZitarePlugin) cmdMotivation(mc *plugin.MessageContext, _ string) error {
	return p.cmdCategory(mc, "motivation")
}

func (p *ZitarePlugin) cmdMorning(mc *plugin.MessageContext, _ string) error {
	return p.cmdCategory(mc, "motivation")
}

func (p *ZitarePlugin) cmdFavorite(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	quote, ok := p.lastQuote[mc.Sender]
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kein Zitat zum Speichern. Hole zuerst eines: `!zitat`")
		return nil
	}

	body := map[string]string{"quoteId": quote.ID}
	if err := p.backend.Post(ctx, "/api/v1/favorites", token, body, nil); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Favorit konnte nicht gespeichert werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "⭐ Zitat als Favorit gespeichert!")
	return nil
}

func (p *ZitarePlugin) cmdFavorites(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var favorites []Quote
	if err := p.backend.Get(ctx, "/api/v1/favorites", token, &favorites); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Favoriten konnten nicht geladen werden.")
		return nil
	}

	if len(favorites) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Favoriten.\n\nSpeichere ein Zitat mit `!favorit` nach `!zitat`.")
		return nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**⭐ Deine Favoriten (%d):**\n\n", len(favorites)))

	limit := len(favorites)
	if limit > 10 {
		limit = 10
	}
	for i := 0; i < limit; i++ {
		q := favorites[i]
		sb.WriteString(fmt.Sprintf("**%d.** \"%s\"\n-- *%s*\n\n", i+1, q.Text, q.Author))
	}
	if len(favorites) > 10 {
		sb.WriteString(fmt.Sprintf("_...und %d weitere_", len(favorites)-10))
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *ZitarePlugin) cmdLists(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var lists []struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}
	if err := p.backend.Get(ctx, "/api/v1/lists", token, &lists); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Listen konnten nicht geladen werden.")
		return nil
	}

	if len(lists) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Listen.\n\nErstelle eine mit: `!liste Meine Zitate`")
		return nil
	}

	var sb strings.Builder
	sb.WriteString("**📋 Deine Listen:**\n\n")
	for i, l := range lists {
		sb.WriteString(fmt.Sprintf("**%d.** %s (%d Zitate)\n", i+1, l.Name, l.Count))
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *ZitarePlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	loggedIn := mc.Session.Manager.IsLoggedIn(mc.Session.UserID)
	status := "❌ Nicht angemeldet"
	if loggedIn {
		status = "✅ Angemeldet"
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("**Zitare Bot Status**\n\n%s", status))
	return nil
}

func (p *ZitarePlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**📜 Zitare Bot - Befehle**

**Zitate:**
• ` + "`!zitat`" + ` — Zufälliges Zitat
• ` + "`!heute`" + ` — Zitat des Tages
• ` + "`!suche Glück`" + ` — Zitate suchen
• ` + "`!kategorie motivation`" + ` — Zitat aus Kategorie
• ` + "`!kategorien`" + ` — Alle Kategorien
• ` + "`!motivation`" + ` — Motivationszitat

**Favoriten:**
• ` + "`!favorit`" + ` — Letztes Zitat als Favorit speichern
• ` + "`!favoriten`" + ` — Alle Favoriten

**Listen:**
• ` + "`!listen`" + ` — Alle Listen`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Formatting ---

func formatQuote(q *Quote) string {
	author := q.Author
	if author == "" {
		author = "Unbekannt"
	}
	return fmt.Sprintf("\"%s\"\n-- *%s*", q.Text, author)
}
