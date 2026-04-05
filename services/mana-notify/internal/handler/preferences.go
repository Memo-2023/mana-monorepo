package handler

import (
	"encoding/json"
	"net/http"

	"github.com/mana/shared-go/httputil"

	"github.com/mana/mana-notify/internal/auth"
	"github.com/mana/mana-notify/internal/db"
)

type PreferencesHandler struct {
	db *db.DB
}

func NewPreferencesHandler(database *db.DB) *PreferencesHandler {
	return &PreferencesHandler{db: database}
}

// Get handles GET /api/v1/preferences
func (h *PreferencesHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUser(r)
	if user == nil {
		httputil.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var p db.Preference
	err := h.db.Pool.QueryRow(r.Context(),
		`SELECT id, user_id, email_enabled, push_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, category_preferences, created_at, updated_at
		 FROM notify.preferences WHERE user_id = $1`, user.UserID,
	).Scan(&p.ID, &p.UserID, &p.EmailEnabled, &p.PushEnabled, &p.QuietHoursEnabled,
		&p.QuietHoursStart, &p.QuietHoursEnd, &p.Timezone, &p.CategoryPreferences, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		// Return defaults
		httputil.WriteJSON(w, http.StatusOK, map[string]any{
			"preferences": map[string]any{
				"emailEnabled":      false,
				"pushEnabled":       true,
				"quietHoursEnabled": false,
				"timezone":          "Europe/Berlin",
			},
		})
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"preferences": p})
}

// Update handles PUT /api/v1/preferences
func (h *PreferencesHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUser(r)
	if user == nil {
		httputil.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		EmailEnabled        *bool          `json:"emailEnabled,omitempty"`
		PushEnabled         *bool          `json:"pushEnabled,omitempty"`
		QuietHoursEnabled   *bool          `json:"quietHoursEnabled,omitempty"`
		QuietHoursStart     *string        `json:"quietHoursStart,omitempty"`
		QuietHoursEnd       *string        `json:"quietHoursEnd,omitempty"`
		Timezone            *string        `json:"timezone,omitempty"`
		CategoryPreferences map[string]any `json:"categoryPreferences,omitempty"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		httputil.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	catJSON, _ := json.Marshal(req.CategoryPreferences)

	_, err := h.db.Pool.Exec(r.Context(),
		`INSERT INTO notify.preferences (user_id, email_enabled, push_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, category_preferences)
		 VALUES ($1, COALESCE($2, false), COALESCE($3, true), COALESCE($4, false), $5, $6, COALESCE($7, 'Europe/Berlin'), $8)
		 ON CONFLICT (user_id) DO UPDATE SET
		   email_enabled = COALESCE($2, notify.preferences.email_enabled),
		   push_enabled = COALESCE($3, notify.preferences.push_enabled),
		   quiet_hours_enabled = COALESCE($4, notify.preferences.quiet_hours_enabled),
		   quiet_hours_start = COALESCE($5, notify.preferences.quiet_hours_start),
		   quiet_hours_end = COALESCE($6, notify.preferences.quiet_hours_end),
		   timezone = COALESCE($7, notify.preferences.timezone),
		   category_preferences = COALESCE($8, notify.preferences.category_preferences),
		   updated_at = NOW()`,
		user.UserID, req.EmailEnabled, req.PushEnabled, req.QuietHoursEnabled,
		req.QuietHoursStart, req.QuietHoursEnd, req.Timezone, catJSON,
	)
	if err != nil {
		httputil.WriteError(w, http.StatusInternalServerError, "failed to update preferences")
		return
	}

	httputil.WriteJSON(w, http.StatusOK, map[string]any{"updated": true})
}
