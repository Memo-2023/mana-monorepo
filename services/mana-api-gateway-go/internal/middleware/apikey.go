package middleware

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/manacore/mana-api-gateway/internal/service"
)

type contextKey string

const ApiKeyContextKey contextKey = "apiKey"

var endpointRegex = regexp.MustCompile(`/v1/(\w+)`)

// ApiKeyMiddleware validates X-API-Key header and attaches key data to context.
func ApiKeyMiddleware(apiKeyService *service.ApiKeyService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			rawKey := r.Header.Get("X-API-Key")
			if rawKey == "" {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"error": "API key required. Use X-API-Key header.",
				})
				return
			}

			keyData, err := apiKeyService.ValidateKey(r.Context(), rawKey)
			if err != nil {
				slog.Debug("invalid api key", "error", err)
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"error": "Invalid API key",
				})
				return
			}

			if !keyData.Active {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"error": "API key is disabled",
				})
				return
			}

			if keyData.ExpiresAt != nil && time.Now().After(*keyData.ExpiresAt) {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"error": "API key has expired",
				})
				return
			}

			// Check endpoint permission
			endpoint := extractEndpoint(r.URL.Path)
			if !hasEndpointPermission(keyData, endpoint) {
				writeJSON(w, http.StatusForbidden, map[string]string{
					"error": "Endpoint '" + endpoint + "' not allowed for this API key. Upgrade your plan.",
				})
				return
			}

			// Attach key data to context
			ctx := context.WithValue(r.Context(), ApiKeyContextKey, keyData)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetApiKey retrieves the API key data from the request context.
func GetApiKey(r *http.Request) *service.ApiKeyData {
	data, _ := r.Context().Value(ApiKeyContextKey).(*service.ApiKeyData)
	return data
}

func extractEndpoint(path string) string {
	m := endpointRegex.FindStringSubmatch(path)
	if len(m) >= 2 {
		return m[1]
	}
	return "unknown"
}

func hasEndpointPermission(keyData *service.ApiKeyData, endpoint string) bool {
	if keyData.AllowedEndpoints == "" {
		return true
	}
	var allowed []string
	if err := json.Unmarshal([]byte(keyData.AllowedEndpoints), &allowed); err != nil {
		return true
	}
	for _, e := range allowed {
		if e == endpoint || strings.HasPrefix(endpoint, e) {
			return true
		}
	}
	return false
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
