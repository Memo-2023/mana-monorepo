package auth

import (
	"net/http"
	"testing"
)

func TestExtractToken(t *testing.T) {
	tests := []struct {
		name      string
		header    string
		wantToken string
	}{
		{"valid bearer", "Bearer eyJhbGciOiJFZERTQSJ9.test.sig", "eyJhbGciOiJFZERTQSJ9.test.sig"},
		{"missing bearer prefix", "eyJhbGciOiJFZERTQSJ9.test.sig", ""},
		{"empty header", "", ""},
		{"lowercase bearer", "bearer token123", ""},
		{"only bearer", "Bearer ", ""},
		{"bearer with space", "Bearer  token123", " token123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r, _ := http.NewRequest("GET", "/", nil)
			if tt.header != "" {
				r.Header.Set("Authorization", tt.header)
			}

			got := ExtractToken(r)
			if got != tt.wantToken {
				t.Errorf("ExtractToken() = %q, want %q", got, tt.wantToken)
			}
		})
	}
}

func TestNewValidator(t *testing.T) {
	v := NewValidator("http://localhost:3001/api/auth/jwks")

	if v.jwksURL != "http://localhost:3001/api/auth/jwks" {
		t.Errorf("jwksURL = %q, want 'http://localhost:3001/api/auth/jwks'", v.jwksURL)
	}

	if len(v.keys) != 0 {
		t.Errorf("expected empty keys map, got %d keys", len(v.keys))
	}

	if v.fetchEvery.Minutes() != 5 {
		t.Errorf("fetchEvery = %v, want 5m", v.fetchEvery)
	}
}

func TestValidateTokenNoKeys(t *testing.T) {
	// Validator with unreachable JWKS endpoint
	v := NewValidator("http://localhost:99999/jwks")

	_, err := v.ValidateToken("some.invalid.token")
	if err == nil {
		t.Error("expected error for token with no keys, got nil")
	}
}

func TestUserIDFromRequestNoAuth(t *testing.T) {
	v := NewValidator("http://localhost:99999/jwks")

	r, _ := http.NewRequest("GET", "/", nil)
	_, err := v.UserIDFromRequest(r)
	if err == nil {
		t.Error("expected error for request without auth header")
	}
}

func TestUserIDFromRequestEmptyBearer(t *testing.T) {
	v := NewValidator("http://localhost:99999/jwks")

	r, _ := http.NewRequest("GET", "/", nil)
	r.Header.Set("Authorization", "Bearer ")
	_, err := v.UserIDFromRequest(r)
	if err == nil {
		t.Error("expected error for empty bearer token")
	}
}
