package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/manacore/mana-search/internal/config"
	"github.com/manacore/mana-search/internal/metrics"
)

type Cache struct {
	client  *redis.Client
	prefix  string
	metrics *metrics.Metrics
	hits    atomic.Int64
	misses  atomic.Int64
}

func New(cfg *config.Config, m *metrics.Metrics) *Cache {
	c := &Cache{
		prefix:  cfg.RedisPrefix,
		metrics: m,
	}

	client := redis.NewClient(&redis.Options{
		Addr:            fmt.Sprintf("%s:%d", cfg.RedisHost, cfg.RedisPort),
		Password:        cfg.RedisPassword,
		MaxRetries:      3,
		MinRetryBackoff: 200 * time.Millisecond,
		MaxRetryBackoff: 2 * time.Second,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		slog.Warn("redis unavailable, running without cache", "error", err)
		return c
	}

	slog.Info("redis connected", "addr", fmt.Sprintf("%s:%d", cfg.RedisHost, cfg.RedisPort))
	c.client = client
	return c
}

func (c *Cache) Get(ctx context.Context, key string) ([]byte, bool) {
	if c.client == nil {
		return nil, false
	}

	val, err := c.client.Get(ctx, c.prefix+key).Bytes()
	if err != nil {
		c.misses.Add(1)
		if c.metrics != nil {
			c.metrics.CacheMisses.Inc()
		}
		return nil, false
	}

	c.hits.Add(1)
	if c.metrics != nil {
		c.metrics.CacheHits.Inc()
	}
	return val, true
}

func (c *Cache) Set(ctx context.Context, key string, value any, ttl time.Duration) {
	if c.client == nil {
		return
	}

	data, err := json.Marshal(value)
	if err != nil {
		slog.Error("cache marshal error", "error", err)
		return
	}

	if err := c.client.Set(ctx, c.prefix+key, data, ttl).Err(); err != nil {
		slog.Error("cache set error", "error", err)
	}
}

func (c *Cache) Delete(ctx context.Context, key string) {
	if c.client == nil {
		return
	}
	c.client.Del(ctx, c.prefix+key)
}

func (c *Cache) Clear(ctx context.Context) (int64, error) {
	if c.client == nil {
		return 0, nil
	}

	keys, err := c.client.Keys(ctx, c.prefix+"*").Result()
	if err != nil {
		return 0, err
	}
	if len(keys) == 0 {
		return 0, nil
	}

	deleted, err := c.client.Del(ctx, keys...).Result()
	return deleted, err
}

type HealthStatus struct {
	Status  string `json:"status"`
	Latency int64  `json:"latency"`
}

func (c *Cache) HealthCheck(ctx context.Context) HealthStatus {
	if c.client == nil {
		return HealthStatus{Status: "disabled", Latency: 0}
	}

	start := time.Now()
	err := c.client.Ping(ctx).Err()
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return HealthStatus{Status: "error", Latency: latency}
	}
	return HealthStatus{Status: "ok", Latency: latency}
}

func (c *Cache) IsConnected() bool {
	return c.client != nil
}

type Stats struct {
	Hits    int64   `json:"hits"`
	Misses  int64   `json:"misses"`
	HitRate float64 `json:"hitRate"`
}

func (c *Cache) Stats() Stats {
	hits := c.hits.Load()
	misses := c.misses.Load()
	total := hits + misses
	var rate float64
	if total > 0 {
		rate = float64(hits) / float64(total)
	}
	return Stats{Hits: hits, Misses: misses, HitRate: rate}
}

func (c *Cache) Close() error {
	if c.client != nil {
		return c.client.Close()
	}
	return nil
}
