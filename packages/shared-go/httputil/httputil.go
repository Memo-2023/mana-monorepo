// Package httputil provides shared HTTP handler utilities for Mana Go services.
package httputil

import (
	"encoding/json"
	"net/http"
	"time"
)

// WriteJSON writes a JSON response with the given status code.
func WriteJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// WriteError writes a standardized error JSON response.
func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, map[string]any{
		"success": false,
		"error": map[string]any{
			"statusCode": status,
			"message":    message,
			"timestamp":  time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// DecodeJSON decodes a JSON request body with a size limit.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any, maxBytes int64) bool {
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBytes)).Decode(dst); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		return false
	}
	return true
}
