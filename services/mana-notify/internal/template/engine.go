package template

import (
	"bytes"
	"context"
	"log/slog"
	"text/template"

	"github.com/manacore/mana-notify/internal/db"
)

type Engine struct {
	db *db.DB
}

func NewEngine(database *db.DB) *Engine {
	return &Engine{db: database}
}

type Rendered struct {
	Subject string
	Body    string
}

// RenderBySlug looks up a template by slug and renders it with the given data.
func (e *Engine) RenderBySlug(ctx context.Context, slug string, data map[string]any, locale string) (*Rendered, error) {
	if locale == "" {
		locale = "de-DE"
	}

	var subject, bodyTemplate *string
	err := e.db.Pool.QueryRow(ctx,
		`SELECT subject, body_template FROM notify.templates WHERE slug = $1 AND locale = $2 AND is_active = true`,
		slug, locale,
	).Scan(&subject, &bodyTemplate)

	if err != nil {
		// Try default locale fallback
		err = e.db.Pool.QueryRow(ctx,
			`SELECT subject, body_template FROM notify.templates WHERE slug = $1 AND is_active = true ORDER BY locale LIMIT 1`,
			slug,
		).Scan(&subject, &bodyTemplate)
		if err != nil {
			return nil, err
		}
	}

	rendered := &Rendered{}

	if subject != nil {
		s, err := renderTemplate(*subject, data)
		if err != nil {
			return nil, err
		}
		rendered.Subject = s
	}

	if bodyTemplate != nil {
		b, err := renderTemplate(*bodyTemplate, data)
		if err != nil {
			return nil, err
		}
		rendered.Body = b
	}

	return rendered, nil
}

// RenderDirect renders a template string with data.
func RenderDirect(tmplStr string, data map[string]any) (string, error) {
	return renderTemplate(tmplStr, data)
}

func renderTemplate(tmplStr string, data map[string]any) (string, error) {
	tmpl, err := template.New("").Parse(tmplStr)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}

// SeedDefaults inserts default system templates if they don't exist.
func (e *Engine) SeedDefaults(ctx context.Context) {
	defaults := []struct {
		slug     string
		channel  string
		subject  string
		body     string
		vars     string
	}{
		{
			slug:    "auth-password-reset",
			channel: "email",
			subject: "Passwort zurücksetzen - ManaCore",
			body:    `<!DOCTYPE html><html><body><h1>Passwort zurücksetzen</h1><p>Hallo {{.userName}},</p><p>Klicke auf den folgenden Link, um dein Passwort zurückzusetzen:</p><p><a href="{{.resetUrl}}">Passwort zurücksetzen</a></p><p>Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p></body></html>`,
			vars:    `{"resetUrl": "URL zum Zurücksetzen", "userName": "Name des Benutzers"}`,
		},
		{
			slug:    "auth-verification",
			channel: "email",
			subject: "E-Mail bestätigen - ManaCore",
			body:    `<!DOCTYPE html><html><body><h1>E-Mail bestätigen</h1><p>Hallo {{.userName}},</p><p>Bitte bestätige deine E-Mail-Adresse:</p><p><a href="{{.verificationUrl}}">E-Mail bestätigen</a></p></body></html>`,
			vars:    `{"verificationUrl": "Bestätigungs-URL", "userName": "Name des Benutzers"}`,
		},
		{
			slug:    "auth-welcome",
			channel: "email",
			subject: "Willkommen bei ManaCore!",
			body:    `<!DOCTYPE html><html><body><h1>Willkommen!</h1><p>Hallo {{.userName}},</p><p>Willkommen bei ManaCore! Du kannst dich jetzt anmelden:</p><p><a href="{{.loginUrl}}">Anmelden</a></p></body></html>`,
			vars:    `{"userName": "Name des Benutzers", "loginUrl": "Login-URL"}`,
		},
		{
			slug:    "calendar-reminder",
			channel: "email",
			subject: "Erinnerung: {{.eventTitle}}",
			body:    `<!DOCTYPE html><html><body><h1>{{.eventTitle}}</h1><p>Wann: {{.eventTime}}</p>{{if .eventLocation}}<p>Wo: {{.eventLocation}}</p>{{end}}<p><a href="{{.eventUrl}}">Termin anzeigen</a></p></body></html>`,
			vars:    `{"eventTitle": "Titel", "eventTime": "Zeit", "eventLocation": "Ort (optional)", "eventUrl": "Link"}`,
		},
		{
			slug:    "task-reminder",
			channel: "email",
			subject: "Erinnerung: {{.taskTitle}}",
			body:    `<!DOCTYPE html><html><body><h1>{{.taskTitle}}</h1>{{if .dueDate}}<p>Fällig: {{.dueDate}}</p>{{end}}<p><a href="{{.taskUrl}}">Aufgabe anzeigen</a></p></body></html>`,
			vars:    `{"taskTitle": "Aufgabentitel", "dueDate": "Fälligkeitsdatum (optional)", "taskUrl": "Link zur Aufgabe"}`,
		},
	}

	for _, d := range defaults {
		_, err := e.db.Pool.Exec(ctx,
			`INSERT INTO notify.templates (slug, channel, subject, body_template, locale, is_system, variables)
			 VALUES ($1, $2, $3, $4, 'de-DE', true, $5)
			 ON CONFLICT (slug, locale) DO NOTHING`,
			d.slug, d.channel, d.subject, d.body, d.vars,
		)
		if err != nil {
			slog.Warn("seed template failed", "slug", d.slug, "error", err)
		}
	}

	slog.Info("default templates seeded")
}
