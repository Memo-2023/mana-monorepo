package config

import (
	"strconv"

	"github.com/manacore/shared-go/envutil"
)

type Config struct {
	Port        int
	DatabaseURL string

	RedisHost     string
	RedisPort     int
	RedisPassword string

	UserAgent        string
	DefaultRateLimit float64
	DefaultMaxDepth  int
	DefaultMaxPages  int
	Timeout          int // ms
	Concurrency      int

	CORSOrigins []string
}

func Load() *Config {
	rateLimit, _ := strconv.ParseFloat(envutil.Get("CRAWLER_DEFAULT_RATE_LIMIT", "2"), 64)

	return &Config{
		Port:             envutil.GetInt("PORT", 3023),
		DatabaseURL:      envutil.Get("DATABASE_URL", "postgresql://manacore:devpassword@localhost:5432/manacore"),
		RedisHost:        envutil.Get("REDIS_HOST", "localhost"),
		RedisPort:        envutil.GetInt("REDIS_PORT", 6379),
		RedisPassword:    envutil.Get("REDIS_PASSWORD", ""),
		UserAgent:        envutil.Get("CRAWLER_USER_AGENT", "ManaCoreCrawler/1.0 (+https://manacore.io/bot)"),
		DefaultRateLimit: rateLimit,
		DefaultMaxDepth:  envutil.GetInt("CRAWLER_DEFAULT_MAX_DEPTH", 3),
		DefaultMaxPages:  envutil.GetInt("CRAWLER_DEFAULT_MAX_PAGES", 100),
		Timeout:          envutil.GetInt("CRAWLER_TIMEOUT", 30000),
		Concurrency:      envutil.GetInt("QUEUE_CONCURRENCY", 5),
		CORSOrigins:      envutil.GetSlice("CORS_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173"}),
	}
}
