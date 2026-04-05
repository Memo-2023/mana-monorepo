// Package auth provides JWT authentication for mana-sync.
// Delegates to shared-go/authutil for EdDSA JWKS validation.
package auth

import (
	"net/http"

	"github.com/mana/shared-go/authutil"
)

// Re-export types so existing consumers don't need to change imports.
type Claims = authutil.Claims

// Validator wraps the shared JWKSValidator.
type Validator = authutil.JWKSValidator

// NewValidator creates a JWT validator that fetches EdDSA keys from the given JWKS URL.
func NewValidator(jwksURL string) *Validator {
	return authutil.NewJWKSValidator(jwksURL)
}

// ExtractToken extracts the bearer token from an HTTP request.
func ExtractToken(r *http.Request) string {
	return authutil.ExtractToken(r)
}
