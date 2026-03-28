package handler

import (
	"encoding/json"
	"net/http"

	"github.com/manacore/shared-go/httputil"

	"github.com/manacore/mana-notify/internal/db"
	tmpl "github.com/manacore/mana-notify/internal/template"
)

type TemplatesHandler struct {
	db     *db.DB
	engine *tmpl.Engine
}

func NewTemplatesHandler(database *db.DB, engine *tmpl.Engine) *TemplatesHandler {
	return &TemplatesHandler{db: database, engine: engine}
}

// List handles GET /api/v1/templates
func (h *TemplatesHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Pool.Query(r.Context(),
		`SELECT id, slug, app_id, channel, subject, body_template, locale, is_active, is_system, variables, created_at, updated_at
		 FROM notify.templates ORDER BY slug`)
	if err != nil {
		httputil.WriteError(w, http.StatusInternalServerError, "failed to list templates")
		return
	}
	defer rows.Close()

	var templates []db.Template
	for rows.Next() {
		var t db.Template
		if err := rows.Scan(&t.ID, &t.Slug, &t.AppID, &t.Channel, &t.Subject, &t.BodyTemplate,
			&t.Locale, &t.IsActive, &t.IsSystem, &t.Variables, &t.CreatedAt, &t.UpdatedAt); err != nil {
			continue
		}
		templates = append(templates, t)
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"templates": templates})
}

// Get handles GET /api/v1/templates/{slug}
func (h *TemplatesHandler) Get(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	locale := r.URL.Query().Get("locale")
	if locale == "" {
		locale = "de-DE"
	}

	var t db.Template
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, slug, app_id, channel, subject, body_template, locale, is_active, is_system, variables, created_at, updated_at
		 FROM notify.templates WHERE slug = $1 AND locale = $2`, slug, locale,
	).Scan(&t.ID, &t.Slug, &t.AppID, &t.Channel, &t.Subject, &t.BodyTemplate,
		&t.Locale, &t.IsActive, &t.IsSystem, &t.Variables, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		httputil.WriteError(w, http.StatusNotFound, "template not found")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"template": t})
}

// Create handles POST /api/v1/templates
func (h *TemplatesHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Slug         string `json:"slug"`
		AppID        string `json:"appId,omitempty"`
		Channel      string `json:"channel"`
		Subject      string `json:"subject,omitempty"`
		BodyTemplate string `json:"bodyTemplate"`
		Locale       string `json:"locale,omitempty"`
		Variables    any    `json:"variables,omitempty"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Slug == "" || req.Channel == "" || req.BodyTemplate == "" {
		httputil.WriteError(w, http.StatusBadRequest, "slug, channel, and bodyTemplate are required")
		return
	}
	if req.Locale == "" {
		req.Locale = "de-DE"
	}

	varsJSON, _ := json.Marshal(req.Variables)

	var id string
	err := h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO notify.templates (slug, app_id, channel, subject, body_template, locale, variables)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
		req.Slug, nilIfEmpty(req.AppID), req.Channel, nilIfEmpty(req.Subject), req.BodyTemplate, req.Locale, varsJSON,
	).Scan(&id)
	if err != nil {
		httputil.WriteError(w, http.StatusConflict, "template already exists for this slug+locale")
		return
	}

	httputil.WriteJSON(w, http.StatusCreated, map[string]any{"id": id})
}

// Update handles PUT /api/v1/templates/{slug}
func (h *TemplatesHandler) Update(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	locale := r.URL.Query().Get("locale")
	if locale == "" {
		locale = "de-DE"
	}

	var req struct {
		Subject      string `json:"subject,omitempty"`
		BodyTemplate string `json:"bodyTemplate,omitempty"`
		IsActive     *bool  `json:"isActive,omitempty"`
		Variables    any    `json:"variables,omitempty"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.db.Pool.Exec(r.Context(),
		`UPDATE notify.templates SET
		 subject = COALESCE($1, subject),
		 body_template = COALESCE($2, body_template),
		 is_active = COALESCE($3, is_active),
		 updated_at = NOW()
		 WHERE slug = $4 AND locale = $5 AND is_system = false`,
		nilIfEmpty(req.Subject), nilIfEmpty(req.BodyTemplate), req.IsActive, slug, locale,
	)
	if err != nil {
		httputil.WriteError(w, http.StatusInternalServerError, "failed to update template")
		return
	}
	if result.RowsAffected() == 0 {
		httputil.WriteError(w, http.StatusNotFound, "template not found or is a system template")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"updated": true})
}

// Delete handles DELETE /api/v1/templates/{slug}
func (h *TemplatesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	result, err := h.db.Pool.Exec(r.Context(),
		`DELETE FROM notify.templates WHERE slug = $1 AND is_system = false`, slug)
	if err != nil {
		httputil.WriteError(w, http.StatusInternalServerError, "failed to delete template")
		return
	}
	if result.RowsAffected() == 0 {
		httputil.WriteError(w, http.StatusNotFound, "template not found or is a system template")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"deleted": true})
}

// Preview handles POST /api/v1/templates/{slug}/preview
func (h *TemplatesHandler) Preview(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	var req struct {
		Data map[string]any `json:"data"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rendered, err := h.engine.RenderBySlug(r.Context(), slug, req.Data, "")
	if err != nil {
		httputil.WriteError(w, http.StatusNotFound, "template not found")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"subject": rendered.Subject, "body": rendered.Body})
}

// PreviewCustom handles POST /api/v1/templates/preview
func (h *TemplatesHandler) PreviewCustom(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Subject      string         `json:"subject,omitempty"`
		BodyTemplate string         `json:"bodyTemplate"`
		Data         map[string]any `json:"data"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	subject := ""
	if req.Subject != "" {
		s, err := tmpl.RenderDirect(req.Subject, req.Data)
		if err != nil {
			httputil.WriteError(w, http.StatusBadRequest, "invalid subject template: "+err.Error())
			return
		}
		subject = s
	}

	body, err := tmpl.RenderDirect(req.BodyTemplate, req.Data)
	if err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid body template: "+err.Error())
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"subject": subject, "body": body})
}
