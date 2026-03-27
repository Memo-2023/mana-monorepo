package handler

import (
	"encoding/json"
	"net/http"

	"github.com/manacore/mana-notify/internal/auth"
	"github.com/manacore/mana-notify/internal/db"
)

type DevicesHandler struct {
	db *db.DB
}

func NewDevicesHandler(database *db.DB) *DevicesHandler {
	return &DevicesHandler{db: database}
}

// Register handles POST /api/v1/devices/register
func (h *DevicesHandler) Register(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUser(r)
	if user == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		PushToken  string `json:"pushToken"`
		TokenType  string `json:"tokenType,omitempty"`
		Platform   string `json:"platform,omitempty"`
		DeviceName string `json:"deviceName,omitempty"`
		AppID      string `json:"appId,omitempty"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.PushToken == "" {
		writeError(w, http.StatusBadRequest, "pushToken is required")
		return
	}

	tokenType := req.TokenType
	if tokenType == "" {
		tokenType = "expo"
	}

	// Upsert: transfer ownership if token exists for different user
	var id string
	err := h.db.Pool.QueryRow(r.Context(),
		`INSERT INTO notify.devices (user_id, push_token, token_type, platform, device_name, app_id)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (push_token) DO UPDATE SET
		   user_id = EXCLUDED.user_id,
		   is_active = true,
		   last_seen_at = NOW(),
		   updated_at = NOW()
		 RETURNING id`,
		user.UserID, req.PushToken, tokenType, nilIfEmpty(req.Platform), nilIfEmpty(req.DeviceName), nilIfEmpty(req.AppID),
	).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to register device")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"device": map[string]any{"id": id}})
}

// List handles GET /api/v1/devices
func (h *DevicesHandler) List(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUser(r)
	if user == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	rows, err := h.db.Pool.Query(r.Context(),
		`SELECT id, user_id, push_token, token_type, platform, device_name, app_id, is_active, last_seen_at, created_at, updated_at
		 FROM notify.devices WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`, user.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list devices")
		return
	}
	defer rows.Close()

	var devices []db.Device
	for rows.Next() {
		var d db.Device
		if err := rows.Scan(&d.ID, &d.UserID, &d.PushToken, &d.TokenType, &d.Platform,
			&d.DeviceName, &d.AppID, &d.IsActive, &d.LastSeenAt, &d.CreatedAt, &d.UpdatedAt); err != nil {
			continue
		}
		devices = append(devices, d)
	}

	writeJSON(w, http.StatusOK, map[string]any{"devices": devices})
}

// Delete handles DELETE /api/v1/devices/{id}
func (h *DevicesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	user := auth.GetUser(r)
	if user == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id := r.PathValue("id")
	result, err := h.db.Pool.Exec(r.Context(),
		`UPDATE notify.devices SET is_active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2`, id, user.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete device")
		return
	}
	if result.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "device not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"deleted": true})
}
