package auth

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT payload from mana-core-auth.
type Claims struct {
	jwt.RegisteredClaims
	Email string `json:"email"`
	Role  string `json:"role"`
	SID   string `json:"sid"`
}

// Validator validates JWTs using EdDSA keys from the JWKS endpoint.
type Validator struct {
	jwksURL    string
	keys       map[string]ed25519.PublicKey
	mu         sync.RWMutex
	lastFetch  time.Time
	fetchEvery time.Duration
}

// NewValidator creates a JWT validator that fetches keys from the given JWKS URL.
func NewValidator(jwksURL string) *Validator {
	return &Validator{
		jwksURL:    jwksURL,
		keys:       make(map[string]ed25519.PublicKey),
		fetchEvery: 5 * time.Minute,
	}
}

// ValidateToken validates a JWT and returns the claims.
func (v *Validator) ValidateToken(tokenStr string) (*Claims, error) {
	// Ensure we have keys
	if err := v.ensureKeys(); err != nil {
		return nil, fmt.Errorf("fetch JWKS: %w", err)
	}

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodEd25519); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("missing kid in token header")
		}

		v.mu.RLock()
		key, found := v.keys[kid]
		v.mu.RUnlock()

		if !found {
			// Try refreshing keys once
			v.mu.Lock()
			v.lastFetch = time.Time{} // Force refresh
			v.mu.Unlock()

			if err := v.ensureKeys(); err != nil {
				return nil, err
			}

			v.mu.RLock()
			key, found = v.keys[kid]
			v.mu.RUnlock()

			if !found {
				return nil, fmt.Errorf("unknown key ID: %s", kid)
			}
		}

		return key, nil
	}, jwt.WithValidMethods([]string{"EdDSA"}))

	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// ExtractToken extracts the bearer token from an HTTP request.
func ExtractToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return auth[7:]
	}
	return ""
}

// UserIDFromRequest validates the token and returns the user ID (sub claim).
func (v *Validator) UserIDFromRequest(r *http.Request) (string, error) {
	token := ExtractToken(r)
	if token == "" {
		return "", fmt.Errorf("no authorization header")
	}

	claims, err := v.ValidateToken(token)
	if err != nil {
		return "", err
	}

	if claims.Subject == "" {
		return "", fmt.Errorf("missing sub claim")
	}

	return claims.Subject, nil
}

func (v *Validator) ensureKeys() error {
	v.mu.RLock()
	if time.Since(v.lastFetch) < v.fetchEvery && len(v.keys) > 0 {
		v.mu.RUnlock()
		return nil
	}
	v.mu.RUnlock()

	v.mu.Lock()
	defer v.mu.Unlock()

	// Double-check after acquiring write lock
	if time.Since(v.lastFetch) < v.fetchEvery && len(v.keys) > 0 {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", v.jwksURL, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("fetch JWKS from %s: %w", v.jwksURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("JWKS returned status %d", resp.StatusCode)
	}

	var jwks struct {
		Keys []struct {
			KID string `json:"kid"`
			KTY string `json:"kty"`
			CRV string `json:"crv"`
			X   string `json:"x"`
		} `json:"keys"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return fmt.Errorf("decode JWKS: %w", err)
	}

	for _, key := range jwks.Keys {
		if key.KTY != "OKP" || key.CRV != "Ed25519" {
			continue
		}

		xBytes, err := base64.RawURLEncoding.DecodeString(key.X)
		if err != nil {
			continue
		}

		if len(xBytes) == ed25519.PublicKeySize {
			v.keys[key.KID] = ed25519.PublicKey(xBytes)
		}
	}

	v.lastFetch = time.Now()
	return nil
}
