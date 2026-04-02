package authutil

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWKSValidator validates JWTs using EdDSA public keys fetched from a JWKS endpoint.
// Keys are cached in-memory and refreshed periodically. If a token references an
// unknown key ID, a forced refresh is attempted before rejecting the token.
type JWKSValidator struct {
	jwksURL    string
	keys       map[string]ed25519.PublicKey
	mu         sync.RWMutex
	lastFetch  time.Time
	fetchEvery time.Duration
}

// NewJWKSValidator creates a validator that fetches EdDSA keys from the given JWKS URL.
func NewJWKSValidator(jwksURL string) *JWKSValidator {
	return &JWKSValidator{
		jwksURL:    jwksURL,
		keys:       make(map[string]ed25519.PublicKey),
		fetchEvery: 5 * time.Minute,
	}
}

// ValidateToken validates a JWT string and returns the parsed claims.
func (v *JWKSValidator) ValidateToken(tokenStr string) (*Claims, error) {
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
			// Force refresh and retry once
			v.mu.Lock()
			v.lastFetch = time.Time{}
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

// UserIDFromRequest validates the token from the request and returns the user ID.
func (v *JWKSValidator) UserIDFromRequest(r *http.Request) (string, error) {
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

func (v *JWKSValidator) ensureKeys() error {
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
