package contacts

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"strings"

	"github.com/mana/mana-matrix-bot/internal/plugin"
	"github.com/mana/mana-matrix-bot/internal/services"
)

func init() {
	plugin.Register("contacts", func() plugin.Plugin { return &ContactsPlugin{} })
}

// Contact represents a contact from the backend.
type Contact struct {
	ID         string  `json:"id"`
	FirstName  string  `json:"firstName"`
	LastName   string  `json:"lastName"`
	Email      *string `json:"email"`
	Phone      *string `json:"phone"`
	Mobile     *string `json:"mobile"`
	Company    *string `json:"company"`
	JobTitle   *string `json:"jobTitle"`
	Website    *string `json:"website"`
	Street     *string `json:"street"`
	City       *string `json:"city"`
	PostalCode *string `json:"postalCode"`
	Country    *string `json:"country"`
	Notes      *string `json:"notes"`
	Birthday   *string `json:"birthday"`
	IsFavorite bool    `json:"isFavorite"`
	IsArchived bool    `json:"isArchived"`
}

// ContactsResponse wraps the paginated contacts response.
type ContactsResponse struct {
	Contacts []Contact `json:"contacts"`
	Total    int       `json:"total"`
}

// ContactsPlugin implements the Matrix contacts bot.
type ContactsPlugin struct {
	backend  *services.BackendClient
	router   *plugin.CommandRouter
	detector *plugin.KeywordDetector
	// Per-user last-shown contact lists for number references
	lastList map[string][]Contact
}

func (p *ContactsPlugin) Name() string { return "contacts" }

func (p *ContactsPlugin) Init(_ context.Context, cfg plugin.PluginConfig) error {
	if cfg.BackendURL == "" {
		return fmt.Errorf("contacts plugin requires BackendURL")
	}
	p.backend = services.NewBackendClient(cfg.BackendURL)
	p.lastList = make(map[string][]Contact)

	p.router = plugin.NewCommandRouter()
	p.router.Handle("!help", p.cmdHelp)
	p.router.Handle("!hilfe", p.cmdHelp)
	p.router.Handle("!kontakte", p.cmdList)
	p.router.Handle("!contacts", p.cmdList)
	p.router.Handle("!liste", p.cmdList)
	p.router.Handle("!list", p.cmdList)
	p.router.Handle("!suche", p.cmdSearch)
	p.router.Handle("!search", p.cmdSearch)
	p.router.Handle("!favoriten", p.cmdFavorites)
	p.router.Handle("!favorites", p.cmdFavorites)
	p.router.Handle("!favs", p.cmdFavorites)
	p.router.Handle("!kontakt", p.cmdDetails)
	p.router.Handle("!contact", p.cmdDetails)
	p.router.Handle("!details", p.cmdDetails)
	p.router.Handle("!neu", p.cmdCreate)
	p.router.Handle("!new", p.cmdCreate)
	p.router.Handle("!add", p.cmdCreate)
	p.router.Handle("!edit", p.cmdEdit)
	p.router.Handle("!bearbeiten", p.cmdEdit)
	p.router.Handle("!loeschen", p.cmdDelete)
	p.router.Handle("!delete", p.cmdDelete)
	p.router.Handle("!del", p.cmdDelete)
	p.router.Handle("!fav", p.cmdToggleFav)
	p.router.Handle("!favorit", p.cmdToggleFav)
	p.router.Handle("!status", p.cmdStatus)

	p.detector = plugin.NewKeywordDetector(append(plugin.CommonKeywords,
		plugin.KeywordCommand{Keywords: []string{"kontakte", "contacts", "alle"}, Command: "list"},
		plugin.KeywordCommand{Keywords: []string{"favoriten", "favorites", "favs"}, Command: "favorites"},
		plugin.KeywordCommand{Keywords: []string{"suche", "search", "finde"}, Command: "search"},
	))

	slog.Info("contacts plugin initialized", "backend", cfg.BackendURL)
	return nil
}

func (p *ContactsPlugin) Commands() []plugin.CommandDef {
	return []plugin.CommandDef{
		{Patterns: []string{"!kontakte", "!contacts"}, Description: "Alle Kontakte", Category: "Kontakte"},
		{Patterns: []string{"!suche [text]", "!search"}, Description: "Kontakte suchen", Category: "Kontakte"},
		{Patterns: []string{"!favoriten"}, Description: "Favoriten", Category: "Kontakte"},
		{Patterns: []string{"!kontakt [nr]"}, Description: "Kontakt-Details", Category: "Kontakte"},
		{Patterns: []string{"!neu Vorname Nachname"}, Description: "Neuer Kontakt", Category: "Kontakte"},
		{Patterns: []string{"!edit [nr] [feld] [wert]"}, Description: "Kontakt bearbeiten", Category: "Kontakte"},
		{Patterns: []string{"!delete [nr]"}, Description: "Kontakt löschen", Category: "Kontakte"},
		{Patterns: []string{"!fav [nr]"}, Description: "Favorit umschalten", Category: "Kontakte"},
	}
}

func (p *ContactsPlugin) HandleTextMessage(ctx context.Context, mc *plugin.MessageContext) error {
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
	case "favorites":
		return p.cmdFavorites(mc, "")
	case "search":
		return p.cmdSearch(mc, mc.Body)
	}

	return nil
}

// --- Command Handlers ---

func (p *ContactsPlugin) cmdList(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var resp ContactsResponse
	if err := p.backend.Get(ctx, "/api/contacts?limit=20", token, &resp); err != nil {
		slog.Error("get contacts failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kontakte konnten nicht geladen werden.")
		return nil
	}

	if len(resp.Contacts) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Kontakte vorhanden.\n\nNeuer Kontakt: `!neu Vorname Nachname`")
		return nil
	}

	p.lastList[mc.Sender] = resp.Contacts
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatContactList(fmt.Sprintf("**Deine Kontakte (%d):**", resp.Total), resp.Contacts))
	return nil
}

func (p *ContactsPlugin) cmdSearch(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib einen Suchbegriff an.\n\nBeispiel: `!suche Max`")
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var resp ContactsResponse
	if err := p.backend.Get(ctx, "/api/contacts?search="+args+"&limit=20", token, &resp); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Suche fehlgeschlagen.")
		return nil
	}

	if len(resp.Contacts) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("📭 Keine Ergebnisse für \"%s\".", args))
		return nil
	}

	p.lastList[mc.Sender] = resp.Contacts
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatContactList(fmt.Sprintf("**Suchergebnisse für \"%s\" (%d):**", args, resp.Total), resp.Contacts))
	return nil
}

func (p *ContactsPlugin) cmdFavorites(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	var resp ContactsResponse
	if err := p.backend.Get(ctx, "/api/contacts?isFavorite=true&limit=20", token, &resp); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Favoriten konnten nicht geladen werden.")
		return nil
	}

	if len(resp.Contacts) == 0 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "📭 Keine Favoriten.\n\nMarkiere mit: `!fav [Nr]`")
		return nil
	}

	p.lastList[mc.Sender] = resp.Contacts
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatContactList("**⭐ Favoriten:**", resp.Contacts))
	return nil
}

func (p *ContactsPlugin) cmdDetails(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	contact, err := p.getContactByNumber(mc, args)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, err.Error())
		return nil
	}

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, formatContactDetails(contact))
	return nil
}

func (p *ContactsPlugin) cmdCreate(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	if args == "" {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte gib einen Namen an.\n\nBeispiel: `!neu Max Mustermann`")
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an: `!login email passwort`")
		return nil
	}

	parts := strings.SplitN(args, " ", 2)
	firstName := parts[0]
	lastName := ""
	if len(parts) > 1 {
		lastName = parts[1]
	}

	body := map[string]string{
		"firstName": firstName,
		"lastName":  lastName,
	}

	var contact Contact
	if err := p.backend.Post(ctx, "/api/contacts", token, body, &contact); err != nil {
		slog.Error("create contact failed", "error", err)
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kontakt konnte nicht erstellt werden.")
		return nil
	}

	name := contact.FirstName
	if contact.LastName != "" {
		name += " " + contact.LastName
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
		fmt.Sprintf("✅ Kontakt **%s** erstellt!\n\nNutze `!kontakte` um die Liste zu sehen oder `!edit` um weitere Daten hinzuzufügen.", name))
	return nil
}

func (p *ContactsPlugin) cmdEdit(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()

	// Parse: [nr] [field] [value]
	parts := strings.SplitN(args, " ", 3)
	if len(parts) < 3 {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Format: `!edit [Nr] [Feld] [Wert]`\n\nFelder: email, phone, mobile, company, job, website, street, city, zip, country, notes, birthday")
		return nil
	}

	contact, err := p.getContactByNumber(mc, parts[0])
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, err.Error())
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an.")
		return nil
	}

	field := mapFieldName(parts[1])
	value := parts[2]

	body := map[string]string{field: value}

	if err := p.backend.Put(ctx, "/api/contacts/"+contact.ID, token, body, nil); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kontakt konnte nicht aktualisiert werden.")
		return nil
	}

	name := contact.FirstName
	if contact.LastName != "" {
		name += " " + contact.LastName
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID,
		fmt.Sprintf("✅ Kontakt **%s** aktualisiert!\n\n**%s:** %s", name, field, value))
	return nil
}

func (p *ContactsPlugin) cmdDelete(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	contact, err := p.getContactByNumber(mc, args)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, err.Error())
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an.")
		return nil
	}

	if err := p.backend.Delete(ctx, "/api/contacts/"+contact.ID, token); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Kontakt konnte nicht gelöscht werden.")
		return nil
	}

	name := contact.FirstName
	if contact.LastName != "" {
		name += " " + contact.LastName
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("🗑️ %s", name))
	return nil
}

func (p *ContactsPlugin) cmdToggleFav(mc *plugin.MessageContext, args string) error {
	ctx := context.Background()
	contact, err := p.getContactByNumber(mc, args)
	if err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, err.Error())
		return nil
	}

	token, ok := mc.Session.Manager.GetToken(mc.Session.UserID)
	if !ok {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "Bitte melde dich zuerst an.")
		return nil
	}

	var updated Contact
	if err := p.backend.Post(ctx, "/api/contacts/"+contact.ID+"/favorite", token, nil, &updated); err != nil {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, "❌ Favorit konnte nicht geändert werden.")
		return nil
	}

	name := contact.FirstName
	if contact.LastName != "" {
		name += " " + contact.LastName
	}
	if updated.IsFavorite {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("⭐ **%s** als Favorit markiert", name))
	} else {
		mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("**%s** aus Favoriten entfernt", name))
	}
	return nil
}

func (p *ContactsPlugin) cmdStatus(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	loggedIn := mc.Session.Manager.IsLoggedIn(mc.Session.UserID)
	status := "❌ Nicht angemeldet"
	if loggedIn {
		status = "✅ Angemeldet"
	}
	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, fmt.Sprintf("**Contacts Bot Status**\n\n%s", status))
	return nil
}

func (p *ContactsPlugin) cmdHelp(mc *plugin.MessageContext, _ string) error {
	ctx := context.Background()
	help := `**👥 Contacts Bot - Befehle**

**Anzeigen:**
• ` + "`!kontakte`" + ` — Alle Kontakte
• ` + "`!suche Max`" + ` — Kontakte suchen
• ` + "`!favoriten`" + ` — Favoriten
• ` + "`!kontakt 1`" + ` — Details zu Kontakt #1

**Verwalten:**
• ` + "`!neu Max Mustermann`" + ` — Neuer Kontakt
• ` + "`!edit 1 email max@test.de`" + ` — Feld bearbeiten
• ` + "`!fav 1`" + ` — Favorit umschalten
• ` + "`!delete 1`" + ` — Kontakt löschen

**Felder:** email, phone, mobile, company, job, website, street, city, zip, country, notes, birthday`

	mc.Client.SendReply(ctx, mc.RoomID, mc.EventID, help)
	return nil
}

// --- Helpers ---

func (p *ContactsPlugin) getContactByNumber(mc *plugin.MessageContext, args string) (*Contact, error) {
	num, err := strconv.Atoi(strings.TrimSpace(args))
	if err != nil || num < 1 {
		return nil, fmt.Errorf("Bitte gib eine gültige Nummer an.\n\nBeispiel: `!kontakt 1`")
	}

	list, ok := p.lastList[mc.Sender]
	if !ok || len(list) == 0 {
		return nil, fmt.Errorf("Bitte zeige zuerst eine Liste an: `!kontakte` oder `!suche`")
	}

	if num > len(list) {
		return nil, fmt.Errorf("❌ Kontakt #%d nicht gefunden.", num)
	}

	return &list[num-1], nil
}

func formatContactList(header string, contacts []Contact) string {
	var sb strings.Builder
	sb.WriteString(header)
	sb.WriteString("\n\n")

	for i, c := range contacts {
		name := c.FirstName
		if c.LastName != "" {
			name += " " + c.LastName
		}
		fav := ""
		if c.IsFavorite {
			fav = " ⭐"
		}
		company := ""
		if c.Company != nil && *c.Company != "" {
			company = " - " + *c.Company
		}
		sb.WriteString(fmt.Sprintf("**%d.** %s%s%s\n", i+1, name, fav, company))
	}

	sb.WriteString("\nNutze `!kontakt [Nr]` für Details.")
	return sb.String()
}

func formatContactDetails(c *Contact) string {
	name := c.FirstName
	if c.LastName != "" {
		name += " " + c.LastName
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("**%s**\n\n", name))

	if c.IsFavorite {
		sb.WriteString("⭐ Favorit\n\n")
	}

	if c.Company != nil && *c.Company != "" {
		sb.WriteString(fmt.Sprintf("**Firma:** %s", *c.Company))
		if c.JobTitle != nil && *c.JobTitle != "" {
			sb.WriteString(fmt.Sprintf(" — %s", *c.JobTitle))
		}
		sb.WriteByte('\n')
	}
	if c.Email != nil && *c.Email != "" {
		sb.WriteString(fmt.Sprintf("**E-Mail:** %s\n", *c.Email))
	}
	if c.Phone != nil && *c.Phone != "" {
		sb.WriteString(fmt.Sprintf("**Telefon:** %s\n", *c.Phone))
	}
	if c.Mobile != nil && *c.Mobile != "" {
		sb.WriteString(fmt.Sprintf("**Mobil:** %s\n", *c.Mobile))
	}

	// Address
	var addr []string
	if c.Street != nil && *c.Street != "" {
		addr = append(addr, *c.Street)
	}
	parts := ""
	if c.PostalCode != nil && *c.PostalCode != "" {
		parts += *c.PostalCode + " "
	}
	if c.City != nil && *c.City != "" {
		parts += *c.City
	}
	if parts != "" {
		addr = append(addr, strings.TrimSpace(parts))
	}
	if c.Country != nil && *c.Country != "" {
		addr = append(addr, *c.Country)
	}
	if len(addr) > 0 {
		sb.WriteString(fmt.Sprintf("**Adresse:** %s\n", strings.Join(addr, ", ")))
	}

	if c.Website != nil && *c.Website != "" {
		sb.WriteString(fmt.Sprintf("**Website:** %s\n", *c.Website))
	}
	if c.Birthday != nil && *c.Birthday != "" {
		sb.WriteString(fmt.Sprintf("**Geburtstag:** %s\n", *c.Birthday))
	}
	if c.Notes != nil && *c.Notes != "" {
		sb.WriteString(fmt.Sprintf("\n**Notizen:** %s\n", *c.Notes))
	}

	return sb.String()
}

func mapFieldName(input string) string {
	switch strings.ToLower(input) {
	case "email":
		return "email"
	case "phone", "telefon":
		return "phone"
	case "mobile", "mobil", "handy":
		return "mobile"
	case "company", "firma":
		return "company"
	case "job", "jobtitle", "beruf":
		return "jobTitle"
	case "website", "web":
		return "website"
	case "street", "strasse":
		return "street"
	case "city", "stadt":
		return "city"
	case "zip", "plz":
		return "postalCode"
	case "country", "land":
		return "country"
	case "notes", "notizen":
		return "notes"
	case "birthday", "geburtstag":
		return "birthday"
	case "firstname", "vorname":
		return "firstName"
	case "lastname", "nachname":
		return "lastName"
	default:
		return input
	}
}
