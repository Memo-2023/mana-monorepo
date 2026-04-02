package authutil

import (
	"context"
	"log/slog"
	"net/http"
)

type contextKey string

const (
	// UserContextKey stores the full *User in context.
	UserContextKey contextKey = "user"
	// UserIDContextKey stores just the user ID string in context.
	UserIDContextKey contextKey = "userID"
	// UserRoleContextKey stores the user role string in context.
	UserRoleContextKey contextKey = "userRole"
)

// TokenValidator is the interface both JWKSValidator and RemoteValidator implement.
type TokenValidator interface {
	ValidateToken(tokenStr string) (*Claims, error)
}

// JWTMiddleware returns HTTP middleware that validates Bearer tokens using the given validator.
// On success, the authenticated User is stored in context (accessible via GetUser/GetUserID/GetUserRole).
func JWTMiddleware(validator TokenValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := ExtractToken(r)
			if tokenStr == "" {
				http.Error(w, `{"error":"unauthorized: missing token"}`, http.StatusUnauthorized)
				return
			}

			claims, err := validator.ValidateToken(tokenStr)
			if err != nil {
				slog.Warn("jwt validation failed", "error", err)
				http.Error(w, `{"error":"unauthorized: invalid token"}`, http.StatusUnauthorized)
				return
			}

			user := UserFromClaims(claims)
			ctx := r.Context()
			ctx = context.WithValue(ctx, UserContextKey, user)
			ctx = context.WithValue(ctx, UserIDContextKey, user.UserID)
			ctx = context.WithValue(ctx, UserRoleContextKey, user.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ServiceKeyMiddleware returns HTTP middleware that validates the X-Service-Key header.
func ServiceKeyMiddleware(serviceKey string) func(http.Handler) http.Handler {
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

// GetUser extracts the authenticated User from the request context.
func GetUser(r *http.Request) *User {
	u, ok := r.Context().Value(UserContextKey).(*User)
	if !ok {
		return nil
	}
	return u
}

// GetUserID extracts the user ID string from the request context.
func GetUserID(r *http.Request) string {
	id, _ := r.Context().Value(UserIDContextKey).(string)
	return id
}

// GetUserRole extracts the user role string from the request context.
func GetUserRole(r *http.Request) string {
	role, _ := r.Context().Value(UserRoleContextKey).(string)
	return role
}
