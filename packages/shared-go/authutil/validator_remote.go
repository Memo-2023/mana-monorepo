package authutil

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// RemoteValidator validates JWTs by calling mana-core-auth's validation endpoint.
// Simpler than JWKS (no key management), but requires the auth service to be available.
type RemoteValidator struct {
	authURL string
	client  *http.Client
}

// NewRemoteValidator creates a validator that delegates to mana-core-auth.
// authURL should be the base URL of mana-core-auth (e.g., "http://localhost:3001").
func NewRemoteValidator(authURL string) *RemoteValidator {
	return &RemoteValidator{
		authURL: authURL,
		client:  &http.Client{Timeout: 5 * time.Second},
	}
}

// ValidateToken validates a JWT by calling the auth service and returns claims.
// Claims are extracted from the token locally (unverified parse), while the auth
// service confirms the token's validity.
func (v *RemoteValidator) ValidateToken(tokenStr string) (*Claims, error) {
	return v.ValidateTokenWithContext(context.Background(), tokenStr)
}

// ValidateTokenWithContext validates a JWT with a context for cancellation.
func (v *RemoteValidator) ValidateTokenWithContext(ctx context.Context, tokenStr string) (*Claims, error) {
	// Parse without verification to extract claims
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())
	token, _, err := parser.ParseUnverified(tokenStr, jwt.MapClaims{})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid claims")
	}

	// Validate via auth service
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		v.authURL+"/api/v1/auth/validate",
		strings.NewReader(`{"token":"`+tokenStr+`"}`))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := v.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token validation failed: %d", resp.StatusCode)
	}

	var result struct {
		Valid bool `json:"valid"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	if !result.Valid {
		return nil, fmt.Errorf("token invalid")
	}

	// Build claims from the unverified token (auth service confirmed validity)
	sub, _ := mapClaims["sub"].(string)
	email, _ := mapClaims["email"].(string)
	role, _ := mapClaims["role"].(string)
	sid, _ := mapClaims["sid"].(string)

	return &Claims{
		RegisteredClaims: jwt.RegisteredClaims{Subject: sub},
		Email:            email,
		Role:             role,
		SID:              sid,
	}, nil
}

// UserIDFromRequest validates the token from the request and returns the user ID.
func (v *RemoteValidator) UserIDFromRequest(r *http.Request) (string, error) {
	token := ExtractToken(r)
	if token == "" {
		return "", fmt.Errorf("no authorization header")
	}

	claims, err := v.ValidateTokenWithContext(r.Context(), token)
	if err != nil {
		return "", err
	}

	if claims.Subject == "" {
		return "", fmt.Errorf("missing sub claim")
	}

	return claims.Subject, nil
}
