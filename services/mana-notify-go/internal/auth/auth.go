package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	SessionID string `json:"sessionId"`
}

type contextKey string

const UserContextKey contextKey = "user"

// ValidateServiceKey checks the X-Service-Key header.
func ValidateServiceKey(serviceKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := r.Header.Get("X-Service-Key")
			if key == "" || key != serviceKey {
				http.Error(w, `{"error":"unauthorized: invalid service key"}`, http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ValidateJWT validates Bearer tokens against mana-core-auth JWKS.
func ValidateJWT(authURL string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				http.Error(w, `{"error":"unauthorized: missing token"}`, http.StatusUnauthorized)
				return
			}
			tokenStr := strings.TrimPrefix(header, "Bearer ")

			// Validate against auth service
			user, err := validateToken(r.Context(), authURL, tokenStr)
			if err != nil {
				slog.Warn("jwt validation failed", "error", err)
				http.Error(w, `{"error":"unauthorized: invalid token"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUser extracts the authenticated user from context.
func GetUser(r *http.Request) *User {
	u, ok := r.Context().Value(UserContextKey).(*User)
	if !ok {
		return nil
	}
	return u
}

func validateToken(ctx context.Context, authURL, tokenStr string) (*User, error) {
	// Parse without verification first to get claims
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())
	token, _, err := parser.ParseUnverified(tokenStr, jwt.MapClaims{})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid claims")
	}

	// Validate via auth service
	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, authURL+"/api/v1/auth/validate", strings.NewReader(`{"token":"`+tokenStr+`"}`))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token validation failed: %d", resp.StatusCode)
	}

	var result struct {
		Valid   bool `json:"valid"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	if !result.Valid {
		return nil, fmt.Errorf("token invalid")
	}

	sub, _ := claims["sub"].(string)
	email, _ := claims["email"].(string)
	role, _ := claims["role"].(string)
	sid, _ := claims["sid"].(string)

	return &User{
		UserID:    sub,
		Email:     email,
		Role:      role,
		SessionID: sid,
	}, nil
}
