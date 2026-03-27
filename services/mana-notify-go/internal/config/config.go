package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port int

	// Database
	DatabaseURL string

	// Redis
	RedisHost     string
	RedisPort     int
	RedisPassword string

	// Auth
	ServiceKey     string
	ManaCoreAuthURL string

	// SMTP (Brevo)
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string

	// Expo Push
	ExpoAccessToken string

	// Matrix
	MatrixHomeserverURL string
	MatrixAccessToken   string

	// Rate Limits
	RateLimitEmailPerMinute int
	RateLimitPushPerMinute  int

	// CORS
	CORSOrigins []string
}

func Load() *Config {
	return &Config{
		Port: getEnvInt("PORT", 3040),

		DatabaseURL: getEnv("DATABASE_URL", "postgresql://manacore:manacore@localhost:5432/mana_notify"),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnvInt("REDIS_PORT", 6379),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		ServiceKey:      getEnv("SERVICE_KEY", "dev-service-key"),
		ManaCoreAuthURL: getEnv("MANA_CORE_AUTH_URL", "http://localhost:3001"),

		SMTPHost:     getEnv("SMTP_HOST", "smtp-relay.brevo.com"),
		SMTPPort:     getEnvInt("SMTP_PORT", 587),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", "ManaCore <noreply@mana.how>"),

		ExpoAccessToken: getEnv("EXPO_ACCESS_TOKEN", ""),

		MatrixHomeserverURL: getEnv("MATRIX_HOMESERVER_URL", ""),
		MatrixAccessToken:   getEnv("MATRIX_ACCESS_TOKEN", ""),

		RateLimitEmailPerMinute: getEnvInt("RATE_LIMIT_EMAIL_PER_MINUTE", 10),
		RateLimitPushPerMinute:  getEnvInt("RATE_LIMIT_PUSH_PER_MINUTE", 100),

		CORSOrigins: getEnvSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173"}),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvSlice(key string, fallback []string) []string {
	if v := os.Getenv(key); v != "" {
		return strings.Split(v, ",")
	}
	return fallback
}
