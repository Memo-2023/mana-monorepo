package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestValidateServiceKey(t *testing.T) {
	const validKey = "test-service-key-123"

	okHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok":true}`))
	})

	middleware := ValidateServiceKey(validKey)
	handler := middleware(okHandler)

	tests := []struct {
		name       string
		key        string
		wantStatus int
	}{
		{
			name:       "valid key passes through",
			key:        validKey,
			wantStatus: http.StatusOK,
		},
		{
			name:       "missing key returns 401",
			key:        "",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "wrong key returns 401",
			key:        "wrong-key",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "partial key returns 401",
			key:        "test-service-key",
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/v1/test", nil)
			if tt.key != "" {
				req.Header.Set("X-Service-Key", tt.key)
			}
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
		})
	}
}

func TestValidateServiceKey_NextHandlerCalled(t *testing.T) {
	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	handler := ValidateServiceKey("key123")(next)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Service-Key", "key123")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if !called {
		t.Fatal("next handler was not called with valid key")
	}
}

func TestValidateServiceKey_NextHandlerNotCalledOnInvalidKey(t *testing.T) {
	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	})

	handler := ValidateServiceKey("correct-key")(next)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Service-Key", "wrong-key")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if called {
		t.Fatal("next handler should not be called with invalid key")
	}
}

func TestValidateJWT_MissingBearer(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next handler should not be called without token")
	})

	handler := ValidateJWT("http://localhost:3001")(next)

	tests := []struct {
		name   string
		header string
	}{
		{"no header", ""},
		{"no Bearer prefix", "Token abc123"},
		{"basic auth", "Basic dXNlcjpwYXNz"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tt.header != "" {
				req.Header.Set("Authorization", tt.header)
			}
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want 401", rec.Code)
			}
		})
	}
}

func TestGetUser_NoUser(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	user := GetUser(req)
	if user != nil {
		t.Fatal("expected nil user from empty context")
	}
}

func TestGetUser_WithUser(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	expected := &User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		SessionID: "sess-456",
	}

	ctx := req.Context()
	ctx = context.WithValue(ctx, UserContextKey, expected)
	req = req.WithContext(ctx)

	user := GetUser(req)
	if user == nil {
		t.Fatal("expected non-nil user")
	}
	if user.UserID != expected.UserID {
		t.Fatalf("UserID = %q, want %q", user.UserID, expected.UserID)
	}
	if user.Email != expected.Email {
		t.Fatalf("Email = %q, want %q", user.Email, expected.Email)
	}
	if user.Role != expected.Role {
		t.Fatalf("Role = %q, want %q", user.Role, expected.Role)
	}
	if user.SessionID != expected.SessionID {
		t.Fatalf("SessionID = %q, want %q", user.SessionID, expected.SessionID)
	}
}
