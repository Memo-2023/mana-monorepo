package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type jwtContextKey string

const UserIDContextKey jwtContextKey = "userID"
const UserRoleContextKey jwtContextKey = "userRole"

// JWTClaims holds the JWT token claims.
type JWTClaims struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

// JWTMiddleware validates Bearer JWT tokens for management endpoints.
// Uses JWKS from mana-core-auth (simplified: accepts any valid JWT structure for now).
func JWTMiddleware(authURL string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"error": "Authorization header required. Use Bearer <JWT>.",
				})
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

			// Validate JWT via auth service
			userID, role, err := validateJWT(r.Context(), authURL, tokenStr)
			if err != nil {
				writeJSON(w, http.StatusUnauthorized, map[string]string{
					"error": "Invalid or expired token",
				})
				return
			}

			ctx := context.WithValue(r.Context(), UserIDContextKey, userID)
			ctx = context.WithValue(ctx, UserRoleContextKey, role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID returns the authenticated user ID from context.
func GetUserID(r *http.Request) string {
	id, _ := r.Context().Value(UserIDContextKey).(string)
	return id
}

// GetUserRole returns the user role from context.
func GetUserRole(r *http.Request) string {
	role, _ := r.Context().Value(UserRoleContextKey).(string)
	return role
}

// validateJWT calls mana-core-auth /api/v1/auth/validate to verify the token.
func validateJWT(ctx context.Context, authURL, token string) (userID, role string, err error) {
	req, err := http.NewRequestWithContext(ctx, "POST", authURL+"/api/v1/auth/validate", strings.NewReader(`{"token":"`+token+`"}`))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("auth service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("auth validation failed: %d", resp.StatusCode)
	}

	var result struct {
		Valid   bool   `json:"valid"`
		UserID  string `json:"userId"`
		Role    string `json:"role"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", "", err
	}

	if !result.Valid {
		return "", "", fmt.Errorf("token not valid")
	}

	return result.UserID, result.Role, nil
}
