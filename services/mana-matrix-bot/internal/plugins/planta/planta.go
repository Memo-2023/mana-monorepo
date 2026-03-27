package planta

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"strings"

	"github.com/manacore/mana-matrix-bot/internal/plugin"
	"github.com/manacore/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("planta", func() plugin.Plugin { return &PlantaPlugin{} })
}

// Plant represents a plant from the backend.
type Plant struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	ScientificName *string `json:"scientificName"`
	Light          *string `json:"light"`
	WaterInterval  *int    `json:"waterInterval"` // days
	Humidity       *string `json:"humidity"`
	Temperature    *string `json:"temperature"`
	Soil           *string `json:"soil"`
	Health         string  `json:"health"` // healthy, needs_attention, sick
	Notes          *string `json:"notes"`
	AcquiredAt     *string `json:"acquiredAt"`
}

// WateringEntry represents a watering event.
type WateringEntry struct {
	Date  string  `json:"date"`
	Notes *string `json:"notes"`
}

// UpcomingWatering represents when a plant needs water.
type UpcomingWatering struct {
	PlantID   string `json:"plantId"`
	PlantName string `json:"plantName"`
	DueDays   int    `json:"dueDays"` // negative = overdue
}

// PlantaPlugin implements the Matrix plant care bot.
type PlantaPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
	lastList map[string][]Plant // per-user
}

func (p *PlantaPlugin) Name() string { return "planta" }

func (p *PlantaPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL == "" {
		return fmt.Errorf("planta plugin requires BackendURL")
	}
	p.backend = services.NewBackendClient(cfg.BackendURL)
	p.lastList = make(map[string][]Plant)

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!pflanzen", p.cmdList)
	p.router.Handle("!plants", p.cmdList)
	p.router.Handle("!liste", p.cmdList)
	p.router.Handle("!pflanze", p.cmdDetails)
	p.router.Handle("!plant", p.cmdDetails)
	p.router.Handle("!details", p.cmdDetails)
	p.router.Handle("!neu", p.cmdCreate)
	p.router.Handle("!new", p.cmdCreate)
	p.router.Handle("!add", p.cmdCreate)
	p.router.Handle("!loeschen", p.cmdDelete)
	p.router.Handle("!delete", p.cmdDelete)
	p.router.Handle("!entfernen", p.cmdDelete)
	p.router.Handle("!edit", p.cmdEdit)
	p.router.Handle("!bearbeiten", p.cmdEdit)
	p.router.Handle("!giessen", p.cmdWater)
	p.router.Handle("!water", p.cmdWater)
	p.router.Handle("!faellig", p.cmdDue)
	p.router.Handle("!due", p.cmdDue)
	p.router.Handle("!upcoming", p.cmdDue)
	p.router.Handle("!historie", p.cmdHistory)
	p.router.Handle("!history", p.cmdHistory)
	p.router.Handle("!verlauf", p.cmdHistory)
	p.router.Handle("!intervall", p.cmdInterval)
	p.router.Handle("!interval", p.cmdInterval)
	p.router.Handle("!frequenz", p.cmdInterval)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"pflanzen", "plants", "meine pflanzen"}, Command: "list"},
		plugin.KeywordCommand{Keywords: []string{"giessen", "water", "bewässern", "wasser geben"}, Command: "water"},
		plugin.KeywordCommand{Keywords: []string{"fällig", "due", "anstehend"}, Command: "due"},
		plugin.KeywordCommand{Keywords: []string{"neue pflanze"}, Command: "create"},
		plugin.KeywordCommand{Keywords: []string{"historie", "history", "verlauf"}, Command: "history"},
	))

	slog.Info("planta plugin initialized", "backend", cfg.BackendURL)
	return nil
}

func (p *PlantaPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!pflanzen", "!plants"}, Description: "Alle Pflanzen", Category: "Pflanzen"},
		{Patterns: []string{"!pflanze [nr]"}, Description: "Pflanzen-Details", Category: "Pflanzen"},
		{Patterns: []string{"!neu [name]"}, Description: "Neue Pflanze", Category: "Pflanzen"},
		{Patterns: []string{"!giessen [nr]"}, Description: "Pflanze gießen", Category: "Pflege"},
		{Patterns: []string{"!fällig", "!due"}, Description: "Gieß-Status", Category: "Pflege"},
		{Patterns: []string{"!historie [nr]"}, Description: "Gieß-Verlauf", Category: "Pflege"},
		{Patterns: []string{"!intervall [nr] [tage]"}, Description: "Gieß-Intervall setzen", Category: "Pflege"},
		{Patterns: []string{"!edit [nr] [feld] [wert]"}, Description: "Pflanze bearbeiten", Category: "Pflanzen"},
		{Patterns: []string{"!delete [nr]"}, Description: "Pflanze löschen", Category: "Pflanzen"},
	}
}

func (p *PlantaPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
	matched, err := p.router.Route(mc)
	if matched {
		return err
	}

	cmd := p.detector.Detect(mc.Body)
	switch cmd {
	case "help":
		return p.cmdHelp(mc, "")
	case "list":
		return p.cmdList(mc, "")
	case "water":
		return p.cmdWater(mc, "")
	case "due":
		return p.cmdDue(mc, "")
	case "create":
		return p.cmdCreate(mc, mc.Body)
	case "history":
		return p.cmdHistory(mc, "")
	}

	return nil
}

// --- Command Handlers ---

func (p *PlantaPlugin) cmdList(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var plants []Plant
	if err := p.backend.Get(ctx, "/api/plants", token, &plants); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Pflanzen konnten nicht geladen werden.")
		return nil
	}

	if len(plants) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Pflanzen vorhanden.\n\nNeue Pflanze: `!neu Monstera`")
		return nil
	}

	p.lastList[mc.Sender] = plants

	var sb strings.Builder
	sb.WriteString("**🌱 Deine Pflanzen:**\n\n")
	for i, plant := range plants {
		icon := healthIcon(plant.Health)
		sb.WriteString(fmt.Sprintf("**%d.** %s **%s**", i+1, icon, plant.Name))
		if plant.ScientificName != nil && *plant.ScientificName != "" {
			sb.WriteString(fmt.Sprintf(" *(%s)*", *plant.ScientificName))
		}
		sb.WriteByte('\n')
	}
	sb.WriteString("\nNutze `!pflanze [Nr]` für Details oder `!fällig` für Gieß-Status")

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *PlantaPlugin) cmdDetails(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	plant, err := p.getPlantByNumber(mc, args)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, err.Error())
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatPlantDetails(plant))
	return nil
}

func (p *PlantaPlugin) cmdCreate(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib einen Pflanzennamen an.\n\nBeispiel: `!neu Monstera Deliciosa`")
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	body := map[string]string{"name": args}
	var plant Plant
	if err := p.backend.Post(ctx, "/api/plants", token, body, &plant); err != nil {
		slog.Error("create plant failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Pflanze konnte nicht erstellt werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("🌱 Pflanze **%s** erstellt!\n\nNutze `!pflanzen` für die Liste.", plant.Name))
	return nil
}

func (p *PlantaPlugin) cmdDelete(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	plant, err := p.getPlantByNumber(mc, args)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, err.Error())
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an.")
		return nil
	}

	if err := p.backend.Delete(ctx, "/api/plants/"+plant.ID, token); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Pflanze konnte nicht gelöscht werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("🗑️ %s", plant.Name))
	return nil
}

func (p *PlantaPlugin) cmdEdit(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	parts := strings.SplitN(args, " ", 3)
	if len(parts) < 3 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Format: `!edit [Nr] [Feld] [Wert]`\n\nFelder: name, art, licht, wasser, feuchtigkeit, temperatur, erde, notizen")
		return nil
	}

	plant, err := p.getPlantByNumber(mc, parts[0])
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, err.Error())
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an.")
		return nil
	}

	field := mapPlantField(parts[1])
	body := map[string]string{field: parts[2]}

	if err := p.backend.Put(ctx, "/api/plants/"+plant.ID, token, body, nil); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Pflanze konnte nicht aktualisiert werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ **%s** aktualisiert: **%s** = %s", plant.Name, field, parts[2]))
	return nil
}

func (p *PlantaPlugin) cmdWater(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	parts := strings.SplitN(args, " ", 2)
	plant, err := p.getPlantByNumber(mc, parts[0])
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine Pflanzennummer an.\n\nBeispiel: `!giessen 1`")
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an.")
		return nil
	}

	body := map[string]string{}
	if len(parts) > 1 {
		body["notes"] = parts[1]
	}

	if err := p.backend.Post(ctx, "/api/watering/"+plant.ID+"/water", token, body, nil); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Gießen konnte nicht gespeichert werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("💧 **%s** gegossen!", plant.Name))
	return nil
}

func (p *PlantaPlugin) cmdDue(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var upcoming []UpcomingWatering
	if err := p.backend.Get(ctx, "/api/watering/upcoming", token, &upcoming); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Gieß-Status konnte nicht geladen werden.")
		return nil
	}

	if len(upcoming) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Pflanzen mit Gieß-Intervall.")
		return nil
	}

	var sb strings.Builder
	sb.WriteString("**💧 Gieß-Status:**\n\n")
	for _, w := range upcoming {
		if w.DueDays < 0 {
			sb.WriteString(fmt.Sprintf("• **%s**: **Überfällig (%d Tage)**\n", w.PlantName, -w.DueDays))
		} else if w.DueDays == 0 {
			sb.WriteString(fmt.Sprintf("• **%s**: **Heute**\n", w.PlantName))
		} else {
			sb.WriteString(fmt.Sprintf("• **%s**: in %d Tagen\n", w.PlantName, w.DueDays))
		}
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *PlantaPlugin) cmdHistory(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	plant, err := p.getPlantByNumber(mc, args)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib eine Pflanzennummer an.\n\nBeispiel: `!historie 1`")
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an.")
		return nil
	}

	var history []WateringEntry
	if err := p.backend.Get(ctx, "/api/watering/"+plant.ID+"/history", token, &history); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Verlauf konnte nicht geladen werden.")
		return nil
	}

	if len(history) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("📭 Kein Gieß-Verlauf für %s.", plant.Name))
		return nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**💧 Gieß-Historie: %s**\n\n", plant.Name))
	limit := len(history)
	if limit > 10 {
		limit = 10
	}
	for i := 0; i < limit; i++ {
		entry := history[i]
		sb.WriteString(fmt.Sprintf("• %s", entry.Date))
		if entry.Notes != nil && *entry.Notes != "" {
			sb.WriteString(fmt.Sprintf(" - %s", *entry.Notes))
		}
		sb.WriteByte('\n')
	}
	if len(history) > 10 {
		sb.WriteString(fmt.Sprintf("\n_...und %d weitere Einträge_", len(history)-10))
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, sb.String())
	return nil
}

func (p *PlantaPlugin) cmdInterval(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	parts := strings.SplitN(args, " ", 2)
	if len(parts) < 2 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Format: `!intervall [Nr] [Tage]`\n\nBeispiel: `!intervall 1 7`")
		return nil
	}

	plant, err := p.getPlantByNumber(mc, parts[0])
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, err.Error())
		return nil
	}

	days, err := strconv.Atoi(parts[1])
	if err != nil || days < 1 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Bitte gib eine gültige Anzahl Tage an.")
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an.")
		return nil
	}

	body := map[string]int{"intervalDays": days}
	if err := p.backend.Put(ctx, "/api/watering/"+plant.ID, token, body, nil); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Intervall konnte nicht gesetzt werden.")
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("✅ **%s**: Gieß-Intervall auf %d Tage gesetzt.", plant.Name, days))
	return nil
}

func (p *PlantaPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	loggedIn := mc.Session.Manager.IsLoggedIn(mc.Session.UserID)
	status := "❌ Nicht angemeldet"
	if loggedIn {
		status = "✅ Angemeldet"
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("**🌱 Planta Bot Status**\n\n%s", status))
	return nil
}

func (p *PlantaPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**🌱 Planta Bot - Befehle**

**Pflanzen:**
• ` + "`!pflanzen`" + ` — Alle Pflanzen
• ` + "`!pflanze 1`" + ` — Details zu Pflanze #1
• ` + "`!neu Monstera`" + ` — Neue Pflanze
• ` + "`!edit 1 licht hell`" + ` — Pflanze bearbeiten
• ` + "`!delete 1`" + ` — Pflanze löschen

**Pflege:**
• ` + "`!giessen 1`" + ` — Pflanze #1 gießen
• ` + "`!fällig`" + ` — Gieß-Status
• ` + "`!historie 1`" + ` — Gieß-Verlauf
• ` + "`!intervall 1 7`" + ` — Alle 7 Tage gießen

**Felder:** name, art, licht, wasser, feuchtigkeit, temperatur, erde, notizen`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Helpers ---

func (p *PlantaPlugin) getPlantByNumber(mc *plugin.MessageContext, args string) (*Plant, error) {
	num, err := strconv.Atoi(strings.TrimSpace(args))
	if err != nil || num < 1 {
		return nil, fmt.Errorf("Bitte gib eine gültige Nummer an.")
	}

	list, ok := p.lastList[mc.Sender]
	if !ok || len(list) == 0 {
		return nil, fmt.Errorf("Bitte zeige zuerst die Liste an: `!pflanzen`")
	}

	if num > len(list) {
		return nil, fmt.Errorf("❌ Pflanze #%d nicht gefunden.", num)
	}

	return &list[num-1], nil
}

func formatPlantDetails(plant *Plant) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**%s %s**\n\n", healthIcon(plant.Health), plant.Name))

	if plant.ScientificName != nil && *plant.ScientificName != "" {
		sb.WriteString(fmt.Sprintf("*%s*\n\n", *plant.ScientificName))
	}

	if plant.Light != nil && *plant.Light != "" {
		sb.WriteString(fmt.Sprintf("• ☀️ Licht: %s\n", *plant.Light))
	}
	if plant.WaterInterval != nil {
		sb.WriteString(fmt.Sprintf("• 💧 Gießen: alle %d Tage\n", *plant.WaterInterval))
	}
	if plant.Humidity != nil && *plant.Humidity != "" {
		sb.WriteString(fmt.Sprintf("• 💨 Feuchtigkeit: %s\n", *plant.Humidity))
	}
	if plant.Temperature != nil && *plant.Temperature != "" {
		sb.WriteString(fmt.Sprintf("• 🌡️ Temperatur: %s\n", *plant.Temperature))
	}
	if plant.Soil != nil && *plant.Soil != "" {
		sb.WriteString(fmt.Sprintf("• 🪴 Erde: %s\n", *plant.Soil))
	}
	sb.WriteString(fmt.Sprintf("• %s Gesundheit: %s\n", healthIcon(plant.Health), plant.Health))

	if plant.Notes != nil && *plant.Notes != "" {
		sb.WriteString(fmt.Sprintf("\n**Notizen:** %s\n", *plant.Notes))
	}

	return sb.String()
}

func healthIcon(health string) string {
	switch health {
	case "healthy":
		return "💚"
	case "needs_attention":
		return "⚠️"
	case "sick":
		return "🔴"
	default:
		return "💚"
	}
}

func mapPlantField(input string) string {
	switch strings.ToLower(input) {
	case "name":
		return "name"
	case "art", "wissenschaftlich", "scientific":
		return "scientificName"
	case "licht", "light":
		return "light"
	case "wasser", "water":
		return "waterInterval"
	case "feuchtigkeit", "humidity":
		return "humidity"
	case "temperatur", "temperature":
		return "temperature"
	case "erde", "soil":
		return "soil"
	case "notizen", "notes":
		return "notes"
	default:
		return input
	}
}
