package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port        int
	DatabaseURL string

	RedisHost     string
	RedisPort     int
	RedisPassword string

	UserAgent       string
	DefaultRateLimit float64
	DefaultMaxDepth int
	DefaultMaxPages int
	Timeout         int // ms
	Concurrency     int

	CORSOrigins []string
}

func Load() *Config {
	port, _ := strconv.Atoi(getEnv("PORT", "3023"))
	redisPort, _ := strconv.Atoi(getEnv("REDIS_PORT", "6379"))
	rateLimit, _ := strconv.ParseFloat(getEnv("CRAWLER_DEFAULT_RATE_LIMIT", "2"), 64)
	maxDepth, _ := strconv.Atoi(getEnv("CRAWLER_DEFAULT_MAX_DEPTH", "3"))
	maxPages, _ := strconv.Atoi(getEnv("CRAWLER_DEFAULT_MAX_PAGES", "100"))
	timeout, _ := strconv.Atoi(getEnv("CRAWLER_TIMEOUT", "30000"))
	concurrency, _ := strconv.Atoi(getEnv("QUEUE_CONCURRENCY", "5"))

	var origins []string
	if o := os.Getenv("CORS_ORIGINS"); o != "" {
		origins = strings.Split(o, ",")
	} else {
		origins = []string{"http://localhost:3000", "http://localhost:5173"}
	}

	return &Config{
		Port:            port,
		DatabaseURL:     getEnv("DATABASE_URL", "postgresql://manacore:devpassword@localhost:5432/manacore"),
		RedisHost:       getEnv("REDIS_HOST", "localhost"),
		RedisPort:       redisPort,
		RedisPassword:   getEnv("REDIS_PASSWORD", ""),
		UserAgent:       getEnv("CRAWLER_USER_AGENT", "ManaCoreCrawler/1.0 (+https://manacore.io/bot)"),
		DefaultRateLimit: rateLimit,
		DefaultMaxDepth: maxDepth,
		DefaultMaxPages: maxPages,
		Timeout:         timeout,
		Concurrency:     concurrency,
		CORSOrigins:     origins,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
