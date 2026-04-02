// Package auth provides authentication middleware for mana-notify.
// Delegates to shared-go/authutil for JWT and service key validation.
package auth

import (
	"net/http"

	"github.com/manacore/shared-go/authutil"
)

// Re-export types for backward compatibility.
type User = authutil.User

// UserContextKey is the context key for the authenticated user.
const UserContextKey = authutil.UserContextKey

// ValidateServiceKey checks the X-Service-Key header.
func ValidateServiceKey(serviceKey string) func(http.Handler) http.Handler {
	return authutil.ServiceKeyMiddleware(serviceKey)
}

// ValidateJWT validates Bearer tokens against mana-core-auth.
func ValidateJWT(authURL string) func(http.Handler) http.Handler {
	validator := authutil.NewRemoteValidator(authURL)
	return authutil.JWTMiddleware(validator)
}

// GetUser extracts the authenticated user from context.
func GetUser(r *http.Request) *User {
	return authutil.GetUser(r)
}
