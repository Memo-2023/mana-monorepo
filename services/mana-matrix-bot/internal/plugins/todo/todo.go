package todo

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
	plugin.Register("todo", func() plugin.Plugin { return &TodoPlugin{} })
}

// Task represents a todo task from the backend.
type Task struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Completed   bool    `json:"completed"`
	Priority    int     `json:"priority"`
	DueDate     *string `json:"dueDate"`
	Project     *string `json:"project"`
	CompletedAt *string `json:"completedAt"`
}

// TaskStats holds task statistics.
type TaskStats struct {
	Total     int `json:"total"`
	Pending   int `json:"pending"`
	Completed int `json:"completed"`
	Today     int `json:"today"`
}

// CreateTaskInput is the request body for creating a task.
type CreateTaskInput struct {
	Title    string  `json:"title"`
	Priority int     `json:"priority,omitempty"`
	DueDate  *string `json:"dueDate,omitempty"`
}

// TodoPlugin implements the Matrix todo bot.
type TodoPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *TodoPlugin) Name() string { return "todo" }

func (p *TodoPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL == "" {
		return fmt.Errorf("todo plugin requires BackendURL")
	}
	p.backend = services.NewBackendClient(cfg.BackendURL)

	// Command router
	p.router = plugin.NewCommandRouter()
	p.router.Handle("!todo", p.cmdAdd)
	p.router.Handle("!add", p.cmdAdd)
	p.router.Handle("!neu", p.cmdAdd)
	p.router.Handle("!list", p.cmdList)
	p.router.Handle("!liste", p.cmdList)
	p.router.Handle("!alle", p.cmdList)
	p.router.Handle("!today", p.cmdToday)
	p.router.Handle("!heute", p.cmdToday)
	p.router.Handle("!inbox", p.cmdInbox)
	p.router.Handle("!eingang", p.cmdInbox)
	p.router.Handle("!done", p.cmdDone)
	p.router.Handle("!erledigt", p.cmdDone)
	p.router.Handle("!fertig", p.cmdDone)
	p.router.Handle("!delete", p.cmdDelete)
	p.router.Handle("!löschen", p.cmdDelete)
	p.router.Handle("!entfernen", p.cmdDelete)
	p.router.Handle("!projects", p.cmdProjects)
	p.router.Handle("!projekte", p.cmdProjects)
	p.router.Handle("!status", p.cmdStatus)
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)

	// Keyword detector
	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"zeige aufgaben", "show tasks"}, Command: "list"},
		plugin.KeywordCommand{Keywords: []string{"heute", "today"}, Command: "today"},
		plugin.KeywordCommand{Keywords: []string{"inbox", "eingang"}, Command: "inbox"},
		plugin.KeywordCommand{Keywords: []string{"projekte", "projects"}, Command: "projects"},
		plugin.KeywordCommand{Keywords: []string{"neu", "neue", "add"}, Command: "add"},
		plugin.KeywordCommand{Keywords: []string{"erledigt", "fertig", "done"}, Command: "done"},
		plugin.KeywordCommand{Keywords: []string{"löschen", "entfernen", "delete"}, Command: "delete"},
	))

	slog.Info("todo plugin initialized", "backend", cfg.BackendURL)
	return nil
}

func (p *TodoPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!todo", "!add", "!neu"}, Description: "Aufgabe erstellen", Category: "Aufgaben"},
		{Patterns: []string{"!list", "!liste"}, Description: "Alle offenen Aufgaben", Category: "Aufgaben"},
		{Patterns: []string{"!today", "!heute"}, Description: "Heutige Aufgaben", Category: "Aufgaben"},
		{Patterns: []string{"!inbox", "!eingang"}, Description: "Aufgaben ohne Datum", Category: "Aufgaben"},
		{Patterns: []string{"!done", "!erledigt"}, Description: "Aufgabe erledigen", Category: "Aufgaben"},
		{Patterns: []string{"!delete", "!löschen"}, Description: "Aufgabe löschen", Category: "Aufgaben"},
		{Patterns: []string{"!projects", "!projekte"}, Description: "Projekte anzeigen", Category: "Aufgaben"},
		{Patterns: []string{"!status"}, Description: "Verbindungsstatus", Category: "System"},
		{Patterns: []string{"!help", "!hilfe"}, Description: "Hilfe anzeigen", Category: "System"},
	}
}

func (p *TodoPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	// Try command router first
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}

	// Try keyword detection
	cmd := p.detector.Detect(mc.Body)
	switch cmd {
	case "help":
		return p.cmdHelp(mc, "")
	case "list":
		return p.cmdList(mc, "")
	case "today":
		return p.cmdToday(mc, "")
	case "inbox":
		return p.cmdInbox(mc, "")
	case "projects":
		return p.cmdProjects(mc, "")
	case "add":
		return p.cmdAdd(mc, mc.Body)
	case "done":
		return p.cmdDone(mc, "")
	case "delete":
		return p.cmdDelete(mc, "")
	}

	// Fallback: treat as new task
	return p.cmdAdd(mc, mc.Body)
}

// --- Command Handlers ---

func (p *TodoPlugin) cmdAdd(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine Aufgabe an.\n\nBeispiel: `!todo Einkaufen @morgen !p1`")
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	title, priority, dueDate, project := parseTaskInput(args)

	input := CreateTaskInput{
		Title:    title,
		Priority: priority,
		DueDate:  dueDate,
	}

	var task Task
	if err := p.backend.Post(ctx, "/api/tasks", token, input, &task); err != nil {
		slog.Error("create task failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgabe konnte nicht erstellt werden.")
		return nil
	}

	// Build response
	response := fmt.Sprintf("✅ Aufgabe erstellt: **%s**", task.Title)
	var details []string
	if priority < 4 {
		details = append(details, fmt.Sprintf("Priorität %d", priority))
	}
	if dueDate != nil {
		details = append(details, formatDate(*dueDate))
	}
	if project != "" {
		details = append(details, "#"+project)
	}
	if len(details) > 0 {
		response += " · " + strings.Join(details, " · ")
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

func (p *TodoPlugin) cmdList(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var tasks []Task
	if err := p.backend.Get(ctx, "/api/tasks?completed=false", token, &tasks); err != nil {
		slog.Error("get tasks failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgaben konnten nicht geladen werden.")
		return nil
	}

	if len(tasks) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine offenen Aufgaben.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatTaskList("📋 **Alle offenen Aufgaben:**", tasks))
	return nil
}

func (p *TodoPlugin) cmdToday(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var tasks []Task
	if err := p.backend.Get(ctx, "/api/tasks/today", token, &tasks); err != nil {
		slog.Error("get today tasks failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgaben konnten nicht geladen werden.")
		return nil
	}

	if len(tasks) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Aufgaben für heute.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatTaskList("📅 **Heutige Aufgaben:**", tasks))
	return nil
}

func (p *TodoPlugin) cmdInbox(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var tasks []Task
	if err := p.backend.Get(ctx, "/api/tasks/inbox", token, &tasks); err != nil {
		slog.Error("get inbox tasks failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgaben konnten nicht geladen werden.")
		return nil
	}

	if len(tasks) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Aufgaben im Eingang.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatTaskList("📥 **Eingang:**", tasks))
	return nil
}

func (p *TodoPlugin) cmdDone(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	num, err := strconv.Atoi(strings.TrimSpace(args))
	if err != nil || num < 1 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine gültige Aufgabennummer an.\n\nBeispiel: `!done 1`")
		return nil
	}

	// Get current task list to find the task by number
	var tasks []Task
	if err := p.backend.Get(ctx, "/api/tasks?completed=false", token, &tasks); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgaben konnten nicht geladen werden.")
		return nil
	}

	if num > len(tasks) {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("❌ Aufgabe #%d nicht gefunden.", num))
		return nil
	}

	task := tasks[num-1]
	var completed Task
	if err := p.backend.Put(ctx, "/api/tasks/"+task.ID+"/complete", token, nil, &completed); err != nil {
		slog.Error("complete task failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgabe konnte nicht erledigt werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ ~~%s~~", task.Title))
	return nil
}

func (p *TodoPlugin) cmdDelete(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	num, err := strconv.Atoi(strings.TrimSpace(args))
	if err != nil || num < 1 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine gültige Aufgabennummer an.\n\nBeispiel: `!delete 1`")
		return nil
	}

	var tasks []Task
	if err := p.backend.Get(ctx, "/api/tasks?completed=false", token, &tasks); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgaben konnten nicht geladen werden.")
		return nil
	}

	if num > len(tasks) {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("❌ Aufgabe #%d nicht gefunden.", num))
		return nil
	}

	task := tasks[num-1]
	if err := p.backend.Delete(ctx, "/api/tasks/"+task.ID, token); err != nil {
		slog.Error("delete task failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Aufgabe konnte nicht gelöscht werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("🗑️ %s", task.Title))
	return nil
}

func (p *TodoPlugin) cmdProjects(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var projects []struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	}
	if err := p.backend.Get(ctx, "/api/projects", token, &projects); err != nil {
		slog.Error("get projects failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Projekte konnten nicht geladen werden.")
		return nil
	}

	if len(projects) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Projekte vorhanden.")
		return nil
	}

	var sb strings.Builder
	sb.WriteString("**Deine Projekte:**\n\n")
	for _, proj := range projects {
		sb.WriteString("• ")
		sb.WriteString(proj.Name)
		sb.WriteByte('\n')
	}
	sb.WriteString("\nZeige Projektaufgaben mit `!projekt [Name]`")

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *TodoPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Nicht angemeldet. Nutze `!login email passwort`")
		return nil
	}

	var stats TaskStats
	if err := p.backend.Get(ctx, "/api/tasks/stats", token, &stats); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "✅ Verbunden")
		return nil
	}

	response := fmt.Sprintf("**Status**\n\n• Offen: %d\n• Heute: %d\n• Erledigt: %d",
		stats.Pending, stats.Today, stats.Completed)
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

func (p *TodoPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**📋 Todo Bot - Befehle**

**Aufgaben:**
• ` + "`!todo Einkaufen @morgen !p1`" + ` — Neue Aufgabe
• ` + "`!list`" + ` — Alle offenen Aufgaben
• ` + "`!today`" + ` — Heutige Aufgaben
• ` + "`!inbox`" + ` — Aufgaben ohne Datum
• ` + "`!done 1`" + ` — Aufgabe #1 erledigen
• ` + "`!delete 1`" + ` — Aufgabe #1 löschen

**Syntax:**
• ` + "`!p1`" + ` bis ` + "`!p4`" + ` — Priorität (1=hoch)
• ` + "`@heute`" + `, ` + "`@morgen`" + `, ` + "`@2025-03-27`" + ` — Datum
• ` + "`#projekt`" + ` — Projekt zuweisen

**Projekte:**
• ` + "`!projekte`" + ` — Alle Projekte

**System:**
• ` + "`!status`" + ` — Verbindungsstatus
• ` + "`!hilfe`" + ` — Diese Hilfe`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Task Formatting ---

func formatTaskList(header string, tasks []Task) string {
	var sb strings.Builder
	sb.WriteString(header)
	sb.WriteString("\n\n")

	for i, task := range tasks {
		sb.WriteString(fmt.Sprintf("**%d.** %s", i+1, task.Title))

		// Priority indicators
		if task.Priority < 4 {
			sb.WriteByte(' ')
			for j := 0; j < 4-task.Priority; j++ {
				sb.WriteString("❗")
			}
		}

		// Due date
		if task.DueDate != nil {
			sb.WriteString("  ")
			sb.WriteString(formatDate(*task.DueDate))
		}

		// Project
		if task.Project != nil && *task.Project != "" {
			sb.WriteString("  #")
			sb.WriteString(*task.Project)
		}

		sb.WriteByte('\n')
	}

	sb.WriteString("\nErledigen: `!done [Nr]` | Löschen: `!delete [Nr]`")
	return sb.String()
}

func formatDate(dateStr string) string {
	today := time.Now().Format("2006-01-02")
	tomorrow := time.Now().AddDate(0, 0, 1).Format("2006-01-02")

	// Handle full ISO datetime or date-only
	date := dateStr
	if len(date) > 10 {
		date = date[:10]
	}

	switch date {
	case today:
		return "Heute"
	case tomorrow:
		return "Morgen"
	default:
		t, err := time.Parse("2006-01-02", date)
		if err != nil {
			return dateStr
		}
		return t.Format("02.01")
	}
}

// --- Input Parsing ---

var (
	rePriority = regexp.MustCompile(`!p([1-4])`)
	reDate     = regexp.MustCompile(`@(\S+)`)
	reProject  = regexp.MustCompile(`#(\S+)`)
)

// parseTaskInput extracts title, priority, dueDate, project from user input.
// Syntax: "Einkaufen !p1 @morgen #haushalt"
func parseTaskInput(input string) (title string, priority int, dueDate *string, project string) {
	priority = 4 // default: lowest

	// Extract priority
	if m := rePriority.FindStringSubmatch(input); len(m) == 2 {
		p, _ := strconv.Atoi(m[1])
		priority = p
	}

	// Extract date
	if m := reDate.FindStringSubmatch(input); len(m) == 2 {
		d := parseGermanDate(m[1])
		if d != "" {
			dueDate = &d
		}
	}

	// Extract project
	if m := reProject.FindStringSubmatch(input); len(m) == 2 {
		project = m[1]
	}

	// Remove markers from title
	title = rePriority.ReplaceAllString(input, "")
	title = reDate.ReplaceAllString(title, "")
	title = reProject.ReplaceAllString(title, "")
	title = strings.TrimSpace(title)

	return
}

// parseGermanDate converts German date keywords to ISO date strings.
func parseGermanDate(keyword string) string {
	now := time.Now()
	switch strings.ToLower(keyword) {
	case "heute", "today":
		return now.Format("2006-01-02")
	case "morgen", "tomorrow":
		return now.AddDate(0, 0, 1).Format("2006-01-02")
	case "übermorgen", "uebermorgen":
		return now.AddDate(0, 0, 2).Format("2006-01-02")
	default:
		// Try ISO date format
		if _, err := time.Parse("2006-01-02", keyword); err == nil {
			return keyword
		}
		return ""
	}
}
