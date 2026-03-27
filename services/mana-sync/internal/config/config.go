package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the sync server.
type Config struct {
	Port        int
	DatabaseURL string
	JWKSUrl     string // mana-core-auth JWKS endpoint for JWT validation
	CORSOrigins string
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	port, _ := strconv.Atoi(getEnv("PORT", "3050"))

	return &Config{
		Port:        port,
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://manacore:devpassword@localhost:5432/mana_sync"),
		JWKSUrl:     getEnv("JWKS_URL", "http://localhost:3001/api/auth/jwks"),
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5188"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
