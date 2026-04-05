package services

import (
	"context"
	"fmt"
	"time"
)

// AuthClient handles login/logout via mana-auth.
type AuthClient struct {
	backend *BackendClient
}

// LoginResponse holds the auth service login response.
type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int    `json:"expiresIn"` // seconds
}

// NewAuthClient creates a new auth service client.
func NewAuthClient(authURL string) *AuthClient {
	return &AuthClient{backend: NewBackendClient(authURL)}
}

// Login authenticates a user and returns a JWT token.
func (c *AuthClient) Login(ctx context.Context, email, password string) (*LoginResponse, error) {
	body := map[string]string{
		"email":    email,
		"password": password,
	}

	var resp LoginResponse
	if err := c.backend.Post(ctx, "/api/v1/auth/login", "", body, &resp); err != nil {
		return nil, fmt.Errorf("login failed: %w", err)
	}

	if resp.Token == "" {
		return nil, fmt.Errorf("login: no token in response")
	}

	return &resp, nil
}

// TokenExpiresAt calculates the expiry time from the login response.
func TokenExpiresAt(resp *LoginResponse) time.Time {
	if resp.ExpiresIn > 0 {
		return time.Now().Add(time.Duration(resp.ExpiresIn) * time.Second)
	}
	// Default: 24 hours
	return time.Now().Add(24 * time.Hour)
}
