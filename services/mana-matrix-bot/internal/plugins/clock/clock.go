package clock

import (
	"context"
	"fmt"
	"log/slog"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/mana/mana-matrix-bot/internal/plugin"
	"github.com/mana/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("clock", func() plugin.Plugin { return &ClockPlugin{} })
}

// Timer represents a timer from the backend.
type Timer struct {
	ID        string `json:"id"`
	Label     string `json:"label"`
	Duration  int    `json:"duration"`  // total seconds
	Remaining int    `json:"remaining"` // remaining seconds
	Status    string `json:"status"`    // running, paused, finished
}

// Alarm represents an alarm from the backend.
type Alarm struct {
	ID    string `json:"id"`
	Time  string `json:"time"`  // HH:MM
	Label string `json:"label"`
}

// ClockPlugin implements the Matrix clock bot.
type ClockPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
}

func (p *ClockPlugin) Name() string { return "clock" }

func (p *ClockPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL == "" {
		return fmt.Errorf("clock plugin requires BackendURL")
	}
	p.backend = services.NewBackendClient(cfg.BackendURL)

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!timer", p.cmdTimer)
	p.router.Handle("!stop", p.cmdStop)
	p.router.Handle("!stopp", p.cmdStop)
	p.router.Handle("!pause", p.cmdStop)
	p.router.Handle("!resume", p.cmdResume)
	p.router.Handle("!weiter", p.cmdResume)
	p.router.Handle("!reset", p.cmdReset)
	p.router.Handle("!timers", p.cmdTimers)
	p.router.Handle("!alarm", p.cmdAlarm)
	p.router.Handle("!alarms", p.cmdAlarms)
	p.router.Handle("!alarme", p.cmdAlarms)
	p.router.Handle("!zeit", p.cmdTime)
	p.router.Handle("!time", p.cmdTime)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"timer status", "laufend"}, Command: "status"},
		plugin.KeywordCommand{Keywords: []string{"stopp", "anhalten"}, Command: "stop"},
		plugin.KeywordCommand{Keywords: []string{"weiter", "fortsetzen"}, Command: "resume"},
		plugin.KeywordCommand{Keywords: []string{"zeit", "uhrzeit", "wie spät"}, Command: "time"},
	))

	slog.Info("clock plugin initialized", "backend", cfg.BackendURL)
	return nil
}

func (p *ClockPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!timer [dauer]"}, Description: "Timer starten (25m, 1h30m)", Category: "Timer"},
		{Patterns: []string{"!stop", "!stopp"}, Description: "Timer pausieren", Category: "Timer"},
		{Patterns: []string{"!resume", "!weiter"}, Description: "Timer fortsetzen", Category: "Timer"},
		{Patterns: []string{"!reset"}, Description: "Timer zurücksetzen", Category: "Timer"},
		{Patterns: []string{"!timers"}, Description: "Alle Timer", Category: "Timer"},
		{Patterns: []string{"!alarm [zeit]"}, Description: "Alarm setzen (07:30)", Category: "Alarm"},
		{Patterns: []string{"!alarms", "!alarme"}, Description: "Alle Alarme", Category: "Alarm"},
		{Patterns: []string{"!zeit", "!time"}, Description: "Aktuelle Uhrzeit", Category: "Uhr"},
	}
}

func (p *ClockPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}

	cmd := p.detector.Detect(mc.Body)
	switch cmd {
	case "help":
		return p.cmdHelp(mc, "")
	case "status":
		return p.cmdStatus(mc, "")
	case "stop":
		return p.cmdStop(mc, "")
	case "resume":
		return p.cmdResume(mc, "")
	case "time":
		return p.cmdTime(mc, "")
	}

	return nil
}

// --- Command Handlers ---

func (p *ClockPlugin) cmdTimer(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine Dauer an.\n\nBeispiel: `!timer 25m` oder `!timer 1h30m`")
		return nil
	}

	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	// Parse duration and optional label
	parts := strings.SplitN(args, " ", 2)
	seconds := parseDuration(parts[0])
	if seconds <= 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Ungültige Dauer. Beispiele: `25m`, `1h`, `1h30m`, `90`")
		return nil
	}

	label := ""
	if len(parts) > 1 {
		label = parts[1]
	}

	body := map[string]any{
		"duration": seconds,
		"label":    label,
	}

	var timer Timer
	if err := p.backend.Post(ctx, "/api/v1/timers", token, body, &timer); err != nil {
		slog.Error("create timer failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Timer konnte nicht erstellt werden.")
		return nil
	}

	// Start the timer
	p.backend.Post(ctx, "/api/v1/timers/"+timer.ID+"/start", token, nil, &timer)

	response := fmt.Sprintf("▶️ **Timer gestartet**\n\n⏱️ %s", formatDuration(seconds))
	if label != "" {
		response += fmt.Sprintf("\n📝 %s", label)
	}
	response += "\n\n`!stop` zum Pausieren"

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

func (p *ClockPlugin) cmdStop(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var timer Timer
	if err := p.backend.Get(ctx, "/api/v1/timers/running", token, &timer); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kein laufender Timer gefunden.")
		return nil
	}

	p.backend.Post(ctx, "/api/v1/timers/"+timer.ID+"/pause", token, nil, nil)

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
		fmt.Sprintf("⏸️ **Timer pausiert**\n\nVerbleibend: %s\n\n`!resume` zum Fortsetzen, `!reset` zum Zurücksetzen",
			formatDuration(timer.Remaining)))
	return nil
}

func (p *ClockPlugin) cmdResume(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var timer Timer
	if err := p.backend.Get(ctx, "/api/v1/timers/running", token, &timer); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kein pausierter Timer gefunden.")
		return nil
	}

	p.backend.Post(ctx, "/api/v1/timers/"+timer.ID+"/resume", token, nil, nil)

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
		fmt.Sprintf("▶️ **Timer läuft weiter**\n\nVerbleibend: %s", formatDuration(timer.Remaining)))
	return nil
}

func (p *ClockPlugin) cmdReset(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var timer Timer
	if err := p.backend.Get(ctx, "/api/v1/timers/running", token, &timer); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kein aktiver Timer gefunden.")
		return nil
	}

	p.backend.Post(ctx, "/api/v1/timers/"+timer.ID+"/reset", token, nil, nil)
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "🔄 Timer zurückgesetzt.")
	return nil
}

func (p *ClockPlugin) cmdTimers(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var timers []Timer
	if err := p.backend.Get(ctx, "/api/v1/timers", token, &timers); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Timer konnten nicht geladen werden.")
		return nil
	}

	if len(timers) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Timer vorhanden.\n\nNeuen Timer: `!timer 25m`")
		return nil
	}

	var sb strings.Builder
	sb.WriteString("**⏱️ Timer:**\n\n")
	for _, t := range timers {
		icon := "⏸️"
		if t.Status == "running" {
			icon = "▶️"
		} else if t.Status == "finished" {
			icon = "✅"
		}
		sb.WriteString(fmt.Sprintf("%s **%s** — %s / %s\n", icon, t.Label, formatDuration(t.Remaining), formatDuration(t.Duration)))
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *ClockPlugin) cmdAlarm(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine Uhrzeit an.\n\nBeispiel: `!alarm 07:30 Aufstehen`")
		return nil
	}

	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	parts := strings.SplitN(args, " ", 2)
	alarmTime := parseAlarmTime(parts[0])
	if alarmTime == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Ungültige Uhrzeit. Beispiel: `07:30`")
		return nil
	}

	label := ""
	if len(parts) > 1 {
		label = parts[1]
	}

	body := map[string]any{
		"time":  alarmTime,
		"label": label,
	}

	var alarm Alarm
	if err := p.backend.Post(ctx, "/api/v1/alarms", token, body, &alarm); err != nil {
		slog.Error("create alarm failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Alarm konnte nicht erstellt werden.")
		return nil
	}

	response := fmt.Sprintf("⏰ **Alarm gestellt!**\n\nZeit: %s Uhr", alarmTime)
	if label != "" {
		response += fmt.Sprintf("\n📝 %s", label)
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

func (p *ClockPlugin) cmdAlarms(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var alarms []Alarm
	if err := p.backend.Get(ctx, "/api/v1/alarms", token, &alarms); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Alarme konnten nicht geladen werden.")
		return nil
	}

	if len(alarms) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Alarme gesetzt.\n\nNeuen Alarm: `!alarm 07:30`")
		return nil
	}

	var sb strings.Builder
	sb.WriteString("**⏰ Alarme:**\n\n")
	for _, a := range alarms {
		sb.WriteString(fmt.Sprintf("• %s Uhr", a.Time))
		if a.Label != "" {
			sb.WriteString(fmt.Sprintf(" — %s", a.Label))
		}
		sb.WriteByte('\n')
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *ClockPlugin) cmdTime(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	now := time.Now()
	days := []string{"Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"}
	months := []string{"", "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"}

	response := fmt.Sprintf("**%s Uhr**\n%s, %d. %s %d",
		now.Format("15:04"),
		days[now.Weekday()],
		now.Day(),
		months[now.Month()],
		now.Year())

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, response)
	return nil
}

func (p *ClockPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, _ := mc.Session.Manager.GetToken(mc.Session.UserID)

	var timer Timer
	timerStatus := "Kein aktiver Timer"
	if err := p.backend.Get(ctx, "/api/v1/timers/running", token, &timer); err == nil {
		timerStatus = fmt.Sprintf("▶️ %s — %s / %s", timer.Label, formatDuration(timer.Remaining), formatDuration(timer.Duration))
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
		fmt.Sprintf("**🕐 Clock Bot Status**\n\n%s", timerStatus))
	return nil
}

func (p *ClockPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**🕐 Clock Bot - Befehle**

**Timer:**
• ` + "`!timer 25m`" + ` — Timer starten
• ` + "`!stop`" + ` — Pausieren
• ` + "`!resume`" + ` — Fortsetzen
• ` + "`!reset`" + ` — Zurücksetzen
• ` + "`!timers`" + ` — Alle Timer

**Alarm:**
• ` + "`!alarm 07:30 Aufstehen`" + ` — Alarm setzen
• ` + "`!alarme`" + ` — Alle Alarme

**Uhr:**
• ` + "`!zeit`" + ` — Aktuelle Uhrzeit

**Dauer-Formate:** ` + "`25m`" + `, ` + "`1h`" + `, ` + "`1h30m`" + `, ` + "`90`" + ` (Minuten)`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Parsing ---

var reDuration = regexp.MustCompile(`(?i)^(?:(\d+)h)?(?:(\d+)m?)?$`)

func parseDuration(input string) int {
	input = strings.TrimSpace(strings.ToLower(input))

	m := reDuration.FindStringSubmatch(input)
	if m == nil {
		// Try plain number (minutes)
		if n, err := strconv.Atoi(input); err == nil && n > 0 {
			return n * 60
		}
		return 0
	}

	hours := 0
	minutes := 0
	if m[1] != "" {
		hours, _ = strconv.Atoi(m[1])
	}
	if m[2] != "" {
		minutes, _ = strconv.Atoi(m[2])
	}

	total := hours*3600 + minutes*60
	if total == 0 && hours == 0 && minutes == 0 {
		return 0
	}
	return total
}

func parseAlarmTime(input string) string {
	input = strings.TrimSpace(input)

	// Match HH:MM
	if matched, _ := regexp.MatchString(`^\d{1,2}:\d{2}$`, input); matched {
		return input
	}

	// Match "7 Uhr 30" or "7 30"
	re := regexp.MustCompile(`^(\d{1,2})\s*(?:uhr\s*)?(\d{2})?$`)
	if m := re.FindStringSubmatch(strings.ToLower(input)); m != nil {
		h := m[1]
		min := "00"
		if m[2] != "" {
			min = m[2]
		}
		return fmt.Sprintf("%s:%s", h, min)
	}

	return ""
}

func formatDuration(seconds int) string {
	if seconds < 0 {
		seconds = 0
	}
	h := seconds / 3600
	m := (seconds % 3600) / 60
	s := seconds % 60

	if h > 0 {
		return fmt.Sprintf("%d:%02d:%02d", h, m, s)
	}
	return fmt.Sprintf("%d:%02d", m, s)
}
