// Package middleware provides HTTP middleware for the API gateway.
// JWT validation delegates to shared-go/authutil.
package middleware

import (
	"net/http"

	"github.com/mana/shared-go/authutil"
)

// JWTMiddleware validates Bearer JWT tokens for management endpoints.
func JWTMiddleware(authURL string) func(http.Handler) http.Handler {
	validator := authutil.NewRemoteValidator(authURL)
	return authutil.JWTMiddleware(validator)
}

// GetUserID returns the authenticated user ID from context.
func GetUserID(r *http.Request) string {
	return authutil.GetUserID(r)
}

// GetUserRole returns the user role from context.
func GetUserRole(r *http.Request) string {
	return authutil.GetUserRole(r)
}
