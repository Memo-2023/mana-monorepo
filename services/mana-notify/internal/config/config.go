package config

import (
	"github.com/manacore/shared-go/envutil"
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
	ServiceKey      string
	ManaCoreAuthURL string

	// SMTP
	SMTPHost        string
	SMTPPort        int
	SMTPUser        string
	SMTPPassword    string
	SMTPFrom        string
	SMTPInsecureTLS bool

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
		Port: envutil.GetInt("PORT", 3040),

		DatabaseURL: envutil.Get("DATABASE_URL", "postgresql://manacore:manacore@localhost:5432/mana_notify"),

		RedisHost:     envutil.Get("REDIS_HOST", "localhost"),
		RedisPort:     envutil.GetInt("REDIS_PORT", 6379),
		RedisPassword: envutil.Get("REDIS_PASSWORD", ""),

		ServiceKey:      envutil.Get("SERVICE_KEY", "dev-service-key"),
		ManaCoreAuthURL: envutil.Get("MANA_CORE_AUTH_URL", "http://localhost:3001"),

		SMTPHost:     envutil.Get("SMTP_HOST", "smtp-relay.brevo.com"),
		SMTPPort:     envutil.GetInt("SMTP_PORT", 587),
		SMTPUser:     envutil.Get("SMTP_USER", ""),
		SMTPPassword: envutil.Get("SMTP_PASSWORD", ""),
		SMTPFrom:        envutil.Get("SMTP_FROM", "ManaCore <noreply@mana.how>"),
		SMTPInsecureTLS: envutil.GetBool("SMTP_INSECURE_TLS", false),

		ExpoAccessToken: envutil.Get("EXPO_ACCESS_TOKEN", ""),

		MatrixHomeserverURL: envutil.Get("MATRIX_HOMESERVER_URL", ""),
		MatrixAccessToken:   envutil.Get("MATRIX_ACCESS_TOKEN", ""),

		RateLimitEmailPerMinute: envutil.GetInt("RATE_LIMIT_EMAIL_PER_MINUTE", 10),
		RateLimitPushPerMinute:  envutil.GetInt("RATE_LIMIT_PUSH_PER_MINUTE", 100),

		CORSOrigins: envutil.GetSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173"}),
	}
}
