package config

import (
	"os"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	// Clear env vars to test defaults
	os.Unsetenv("PORT")
	os.Unsetenv("DATABASE_URL")
	os.Unsetenv("JWKS_URL")
	os.Unsetenv("CORS_ORIGINS")

	cfg := Load()

	if cfg.Port != 3050 {
		t.Errorf("Port = %d, want 3050", cfg.Port)
	}
	if cfg.DatabaseURL == "" {
		t.Error("DatabaseURL should not be empty")
	}
	if cfg.JWKSUrl == "" {
		t.Error("JWKSUrl should not be empty")
	}
	if cfg.CORSOrigins == "" {
		t.Error("CORSOrigins should not be empty")
	}
}

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("PORT", "8080")
	os.Setenv("DATABASE_URL", "postgresql://test:test@db:5432/test")
	os.Setenv("JWKS_URL", "https://auth.example.com/jwks")
	os.Setenv("CORS_ORIGINS", "https://app.example.com")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("DATABASE_URL")
		os.Unsetenv("JWKS_URL")
		os.Unsetenv("CORS_ORIGINS")
	}()

	cfg := Load()

	if cfg.Port != 8080 {
		t.Errorf("Port = %d, want 8080", cfg.Port)
	}
	if cfg.DatabaseURL != "postgresql://test:test@db:5432/test" {
		t.Errorf("DatabaseURL = %q, want postgresql://test:test@db:5432/test", cfg.DatabaseURL)
	}
	if cfg.JWKSUrl != "https://auth.example.com/jwks" {
		t.Errorf("JWKSUrl = %q, want https://auth.example.com/jwks", cfg.JWKSUrl)
	}
	if cfg.CORSOrigins != "https://app.example.com" {
		t.Errorf("CORSOrigins = %q, want https://app.example.com", cfg.CORSOrigins)
	}
}

func TestLoadInvalidPort(t *testing.T) {
	os.Setenv("PORT", "not-a-number")
	defer os.Unsetenv("PORT")

	cfg := Load()

	// Invalid port should fall back to 0 (strconv.Atoi error)
	if cfg.Port != 0 {
		t.Errorf("Port = %d, want 0 for invalid input", cfg.Port)
	}
}
