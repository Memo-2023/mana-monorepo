// Package authutil provides shared JWT authentication utilities for Mana Go services.
//
// Two validator implementations are available:
//   - JWKSValidator: validates EdDSA JWTs locally using cached JWKS keys (recommended for high-throughput)
//   - RemoteValidator: validates JWTs by calling mana-auth's /api/v1/auth/validate endpoint
//
// Both validators produce the same Claims/User types and work with the same middleware helpers.
package authutil

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT payload from mana-auth (EdDSA tokens).
type Claims struct {
	jwt.RegisteredClaims
	Email string `json:"email"`
	Role  string `json:"role"`
	SID   string `json:"sid"`
}

// User represents an authenticated user extracted from a JWT.
type User struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	SessionID string `json:"sessionId"`
}

// UserFromClaims converts JWT claims to a User struct.
func UserFromClaims(c *Claims) *User {
	return &User{
		UserID:    c.Subject,
		Email:     c.Email,
		Role:      c.Role,
		SessionID: c.SID,
	}
}

// ExtractToken extracts the Bearer token from an HTTP request's Authorization header.
func ExtractToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return auth[7:]
	}
	return ""
}
