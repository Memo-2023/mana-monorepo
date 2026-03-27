package calendar

import (
	"context"
	"fmt"
	"log/slog"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("calendar", func() plugin.Plugin { return &CalendarPlugin{} })
}

// Event represents a calendar event from the backend.
type Event struct {
	ID        string  `json:"id"`
	Title     string  `json:"title"`
	StartTime string  `json:"startTime"`
	EndTime   string  `json:"endTime"`
	IsAllDay  bool    `json:"isAllDay"`
	Location  *string `json:"location"`
	Notes     *string `json:"notes"`
	Calendar  *string `json:"calendar"`
}

// CreateEventInput is the request body for creating an event.
type CreateEventInput struct {
	Title     string  `json:"title"`
	StartTime string  `json:"startTime"`
	EndTime   string  `json:"endTime"`
	IsAllDay  bool    `json:"isAllDay"`
	Location  *string `json:"location,omitempty"`
}

// CalendarPlugin implements the Matrix calendar bot.
type CalendarPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *CalendarPlugin) Name() string { return "calendar" }

func (p *CalendarPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL == "" {
		return fmt.Errorf("calendar plugin requires BackendURL")
	}
	p.backend = services.NewBackendClient(cfg.BackendURL)

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!today", p.cmdToday)
	p.router.Handle("!heute", p.cmdToday)
	p.router.Handle("!tomorrow", p.cmdTomorrow)
	p.router.Handle("!morgen", p.cmdTomorrow)
	p.router.Handle("!week", p.cmdWeek)
	p.router.Handle("!woche", p.cmdWeek)
	p.router.Handle("!events", p.cmdUpcoming)
	p.router.Handle("!termine", p.cmdUpcoming)
	p.router.Handle("!upcoming", p.cmdUpcoming)
	p.router.Handle("!termin", p.cmdCreate)
	p.router.Handle("!event", p.cmdCreate)
	p.router.Handle("!neu", p.cmdCreate)
	p.router.Handle("!add", p.cmdCreate)
	p.router.Handle("!details", p.cmdDetails)
	p.router.Handle("!info", p.cmdDetails)
	p.router.Handle("!delete", p.cmdDelete)
	p.router.Handle("!löschen", p.cmdDelete)
	p.router.Handle("!entfernen", p.cmdDelete)
	p.router.Handle("!calendars", p.cmdCalendars)
	p.router.Handle("!kalender", p.cmdCalendars)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"was steht heute an", "termine heute"}, Command: "today"},
		plugin.KeywordCommand{Keywords: []string{"termine morgen", "was ist morgen"}, Command: "tomorrow"},
		plugin.KeywordCommand{Keywords: []string{"diese woche", "wochenübersicht"}, Command: "week"},
		plugin.KeywordCommand{Keywords: []string{"zeige kalender", "meine kalender"}, Command: "calendars"},
	))

	slog.Info("calendar plugin initialized", "backend", cfg.BackendURL)
	return nil
}

func (p *CalendarPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!today", "!heute"}, Description: "Heutige Termine", Category: "Kalender"},
		{Patterns: []string{"!tomorrow", "!morgen"}, Description: "Termine morgen", Category: "Kalender"},
		{Patterns: []string{"!week", "!woche"}, Description: "Wochenübersicht", Category: "Kalender"},
		{Patterns: []string{"!events", "!termine"}, Description: "Nächste 14 Tage", Category: "Kalender"},
		{Patterns: []string{"!termin", "!event"}, Description: "Neuen Termin erstellen", Category: "Kalender"},
		{Patterns: []string{"!details [nr]"}, Description: "Termin-Details", Category: "Kalender"},
		{Patterns: []string{"!delete [nr]", "!löschen [nr]"}, Description: "Termin löschen", Category: "Kalender"},
		{Patterns: []string{"!calendars", "!kalender"}, Description: "Kalender anzeigen", Category: "Kalender"},
	}
}

func (p *CalendarPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}

	cmd := p.detector.Detect(mc.Body)
	switch cmd {
	case "help":
		return p.cmdHelp(mc, "")
	case "today":
		return p.cmdToday(mc, "")
	case "tomorrow":
		return p.cmdTomorrow(mc, "")
	case "week":
		return p.cmdWeek(mc, "")
	case "calendars":
		return p.cmdCalendars(mc, "")
	}

	return nil
}

// --- Command Handlers ---

func (p *CalendarPlugin) cmdToday(mc *plugin.MessageContext, _ string) error {
	return p.fetchAndShowEvents(mc, "/api/events/today", "📅 **Termine heute:**", "Keine Termine für heute.")
}

func (p *CalendarPlugin) cmdTomorrow(mc *plugin.MessageContext, _ string) error {
	return p.fetchAndShowEvents(mc, "/api/events/tomorrow", "📅 **Termine morgen:**", "Keine Termine für morgen.")
}

func (p *CalendarPlugin) cmdWeek(mc *plugin.MessageContext, _ string) error {
	return p.fetchAndShowEvents(mc, "/api/events/week", "📅 **Diese Woche:**", "Keine Termine diese Woche.")
}

func (p *CalendarPlugin) cmdUpcoming(mc *plugin.MessageContext, _ string) error {
	return p.fetchAndShowEvents(mc, "/api/events/upcoming?days=14", "📅 **Nächste 14 Tage:**", "Keine anstehenden Termine.")
}

func (p *CalendarPlugin) fetchAndShowEvents(mc *plugin.MessageContext, path, header, emptyMsg string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var events []Event
	if err := p.backend.Get(ctx, path, token, &events); err != nil {
		slog.Error("fetch events failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Termine konnten nicht geladen werden.")
		return nil
	}

	if len(events) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 "+emptyMsg)
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatEventList(header, events))
	return nil
}

func (p *CalendarPlugin) cmdCreate(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib einen Termin an.\n\nBeispiel: `!termin Meeting morgen um 14:00`")
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	title, startTime, endTime, isAllDay := parseEventInput(args)

	input := CreateEventInput{
		Title:     title,
		StartTime: startTime,
		EndTime:   endTime,
		IsAllDay:  isAllDay,
	}

	var event Event
	if err := p.backend.Post(ctx, "/api/events", token, input, &event); err != nil {
		slog.Error("create event failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Termin konnte nicht erstellt werden.")
		return nil
	}

	response := fmt.Sprintf("✅ Termin erstellt: **%s**\n📆 %s", event.Title, formatEventTime(event))
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

func (p *CalendarPlugin) cmdDetails(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Details-Funktion wird noch implementiert.")
	return nil
}

func (p *CalendarPlugin) cmdDelete(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	num, err := strconv.Atoi(strings.TrimSpace(args))
	if err != nil || num < 1 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine gültige Terminnummer an.\n\nBeispiel: `!delete 1`")
		return nil
	}

	// Get current events to find by number
	var events []Event
	if err := p.backend.Get(ctx, "/api/events/upcoming?days=14", token, &events); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Termine konnten nicht geladen werden.")
		return nil
	}

	if num > len(events) {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("❌ Termin #%d nicht gefunden.", num))
		return nil
	}

	event := events[num-1]
	if err := p.backend.Delete(ctx, "/api/events/"+event.ID, token); err != nil {
		slog.Error("delete event failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Termin konnte nicht gelöscht werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("🗑️ %s", event.Title))
	return nil
}

func (p *CalendarPlugin) cmdCalendars(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var calendars []struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	}
	if err := p.backend.Get(ctx, "/api/calendars", token, &calendars); err != nil {
		slog.Error("get calendars failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kalender konnten nicht geladen werden.")
		return nil
	}

	if len(calendars) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Kalender vorhanden.")
		return nil
	}

	var sb strings.Builder
	sb.WriteString("**Deine Kalender:**\n\n")
	for _, cal := range calendars {
		sb.WriteString("• ")
		sb.WriteString(cal.Name)
		sb.WriteByte('\n')
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *CalendarPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	loggedIn := mc.Session.Manager.IsLoggedIn(mc.Session.UserID)
	status := "❌ Nicht angemeldet"
	if loggedIn {
		status = "✅ Angemeldet"
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("📊 **Status**\n\n%s\n🔄 Synchronisiert mit calendar-backend", status))
	return nil
}

func (p *CalendarPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**📅 Calendar Bot - Befehle**

**Termine anzeigen:**
• ` + "`!heute`" + ` — Heutige Termine
• ` + "`!morgen`" + ` — Termine morgen
• ` + "`!woche`" + ` — Wochenübersicht
• ` + "`!termine`" + ` — Nächste 14 Tage

**Verwalten:**
• ` + "`!termin Meeting morgen um 14:00`" + ` — Neuer Termin
• ` + "`!löschen 1`" + ` — Termin #1 löschen
• ` + "`!kalender`" + ` — Kalender anzeigen

**System:**
• ` + "`!status`" + ` — Verbindungsstatus
• ` + "`!hilfe`" + ` — Diese Hilfe`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Formatting ---

func formatEventList(header string, events []Event) string {
	var sb strings.Builder
	sb.WriteString(header)
	sb.WriteString("\n\n")

	for i, evt := range events {
		sb.WriteString(fmt.Sprintf("**%d.** %s\n", i+1, evt.Title))
		sb.WriteString(fmt.Sprintf("   🕐 %s\n", formatEventTime(evt)))
	}

	sb.WriteString("\n📋 Details: `!details [Nr]` | 🗑️ Löschen: `!löschen [Nr]`")
	return sb.String()
}

func formatEventTime(evt Event) string {
	if evt.IsAllDay {
		return "Ganztägig"
	}

	t, err := time.Parse(time.RFC3339, evt.StartTime)
	if err != nil {
		return evt.StartTime
	}

	today := time.Now().Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")
	eventDate := t.Format("2006-01-02")

	var dayStr string
	switch eventDate {
	case today:
		dayStr = "Heute"
	case tomorrow:
		dayStr = "Morgen"
	default:
		dayStr = t.Format("02.01")
	}

	return fmt.Sprintf("%s, %s", dayStr, t.Format("15:04"))
}

// --- Input Parsing ---

var reTime = regexp.MustCompile(`(?i)(?:um\s+)?(\d{1,2}):(\d{2})`)

func parseEventInput(input string) (title string, startTime string, endTime string, isAllDay bool) {
	now := time.Now()
	startDate := now

	// Check for date keywords
	lower := strings.ToLower(input)
	if strings.Contains(lower, "morgen") || strings.Contains(lower, "tomorrow") {
		startDate = now.AddDate(0, 0, 1)
		input = strings.NewReplacer("morgen", "", "tomorrow", "").Replace(input)
	} else if strings.Contains(lower, "übermorgen") {
		startDate = now.AddDate(0, 0, 2)
		input = strings.Replace(input, "übermorgen", "", 1)
	}

	// Check for "ganztägig"
	if strings.Contains(lower, "ganztägig") || strings.Contains(lower, "ganztaegig") || strings.Contains(lower, "all day") {
		isAllDay = true
		input = strings.NewReplacer("ganztägig", "", "ganztaegig", "", "all day", "").Replace(input)
	}

	// Extract time
	if m := reTime.FindStringSubmatch(input); len(m) == 3 {
		h, _ := strconv.Atoi(m[1])
		min, _ := strconv.Atoi(m[2])
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), h, min, 0, 0, startDate.Location())
		input = reTime.ReplaceAllString(input, "")
	} else if !isAllDay {
		// Default to current time + 1 hour
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), now.Hour()+1, 0, 0, 0, now.Location())
	}

	// Remove "um" keyword
	input = strings.NewReplacer(" um ", " ", "Um ", "").Replace(input)

	startTime = startDate.Format(time.RFC3339)
	endTime = startDate.Add(1 * time.Hour).Format(time.RFC3339)
	title = strings.TrimSpace(input)

	if title == "" {
		title = "Neuer Termin"
	}

	return
}
