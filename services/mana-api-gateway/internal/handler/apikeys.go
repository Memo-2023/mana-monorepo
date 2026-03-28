package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/manacore/mana-api-gateway/internal/middleware"
	"github.com/manacore/mana-api-gateway/internal/service"
)

// ApiKeysHandler handles API key management endpoints.
type ApiKeysHandler struct {
	apiKeyService *service.ApiKeyService
	usageService  *service.UsageService
}

// NewApiKeysHandler creates a new handler.
func NewApiKeysHandler(apiKeySvc *service.ApiKeyService, usageSvc *service.UsageService) *ApiKeysHandler {
	return &ApiKeysHandler{apiKeyService: apiKeySvc, usageService: usageSvc}
}

// CreateKey handles POST /api-keys
func (h *ApiKeysHandler) CreateKey(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Tier        string `json:"tier"`
		IsTest      bool   `json:"isTest"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if body.Name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
		return
	}

	if body.Tier == "" {
		body.Tier = "free"
	}

	rawKey, apiKey, err := h.apiKeyService.Create(r.Context(), userID, body.Name, body.Description, body.Tier, body.IsTest)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create key"})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"key":    rawKey,
		"apiKey": apiKey,
	})
}

// ListKeys handles GET /api-keys
func (h *ApiKeysHandler) ListKeys(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	keys, err := h.apiKeyService.ListByUser(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list keys"})
		return
	}

	if keys == nil {
		keys = []service.ApiKey{}
	}

	writeJSON(w, http.StatusOK, keys)
}

// DeleteKey handles DELETE /api-keys/{id}
func (h *ApiKeysHandler) DeleteKey(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	keyID := r.PathValue("id")

	if err := h.apiKeyService.Delete(r.Context(), keyID, userID); err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "key not found"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "key deleted"})
}

// GetUsage handles GET /api-keys/{id}/usage
func (h *ApiKeysHandler) GetUsage(w http.ResponseWriter, r *http.Request) {
	keyID := r.PathValue("id")

	usage, err := h.usageService.GetDailyUsage(r.Context(), keyID, 30)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get usage"})
		return
	}

	if usage == nil {
		usage = []service.DailyUsage{}
	}

	writeJSON(w, http.StatusOK, usage)
}

// GetUsageSummary handles GET /api-keys/{id}/usage/summary
func (h *ApiKeysHandler) GetUsageSummary(w http.ResponseWriter, r *http.Request) {
	keyID := r.PathValue("id")
	since := time.Now().AddDate(0, -1, 0) // last 30 days

	summary, err := h.usageService.GetSummary(r.Context(), keyID, since)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get summary"})
		return
	}

	writeJSON(w, http.StatusOK, summary)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
