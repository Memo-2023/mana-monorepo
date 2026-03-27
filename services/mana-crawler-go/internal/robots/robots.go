package robots

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/temoto/robotstxt"
)

// Checker checks robots.txt rules for URLs.
type Checker struct {
	userAgent string
	client    *http.Client
	mu        sync.RWMutex
	cache     map[string]*cacheEntry
}

type cacheEntry struct {
	data      *robotstxt.RobotsData
	expiresAt time.Time
}

// NewChecker creates a new robots.txt checker.
func NewChecker(userAgent string) *Checker {
	return &Checker{
		userAgent: userAgent,
		client:    &http.Client{Timeout: 5 * time.Second},
		cache:     make(map[string]*cacheEntry),
	}
}

// IsAllowed checks if a URL can be crawled.
func (c *Checker) IsAllowed(ctx context.Context, rawURL string) (bool, error) {
	u, err := parseHost(rawURL)
	if err != nil {
		return true, nil
	}

	robots, err := c.getRobots(ctx, u.scheme, u.host)
	if err != nil {
		return true, nil // Allow on error
	}

	group := robots.FindGroup(c.userAgent)
	if group == nil {
		return true, nil
	}

	return group.Test(rawURL), nil
}

// GetCrawlDelay returns the crawl delay for a domain.
func (c *Checker) GetCrawlDelay(ctx context.Context, rawURL string) time.Duration {
	u, err := parseHost(rawURL)
	if err != nil {
		return 0
	}

	robots, err := c.getRobots(ctx, u.scheme, u.host)
	if err != nil {
		return 0
	}

	group := robots.FindGroup(c.userAgent)
	if group == nil {
		return 0
	}

	return group.CrawlDelay
}

func (c *Checker) getRobots(ctx context.Context, scheme, host string) (*robotstxt.RobotsData, error) {
	c.mu.RLock()
	entry, ok := c.cache[host]
	c.mu.RUnlock()

	if ok && time.Now().Before(entry.expiresAt) {
		return entry.data, nil
	}

	// Fetch
	robotsURL := fmt.Sprintf("%s://%s/robots.txt", scheme, host)
	req, err := http.NewRequestWithContext(ctx, "GET", robotsURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", c.userAgent)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// No robots.txt → allow all
		empty := &robotstxt.RobotsData{}
		c.cacheSet(host, empty)
		return empty, nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	robots, err := robotstxt.FromBytes(body)
	if err != nil {
		slog.Warn("invalid robots.txt", "host", host, "error", err)
		empty := &robotstxt.RobotsData{}
		c.cacheSet(host, empty)
		return empty, nil
	}

	c.cacheSet(host, robots)
	return robots, nil
}

func (c *Checker) cacheSet(host string, data *robotstxt.RobotsData) {
	c.mu.Lock()
	c.cache[host] = &cacheEntry{data: data, expiresAt: time.Now().Add(24 * time.Hour)}
	c.mu.Unlock()
}

type hostInfo struct {
	scheme string
	host   string
}

func parseHost(rawURL string) (hostInfo, error) {
	// Simple parsing without importing net/url to avoid circular deps
	scheme := "https"
	rest := rawURL
	if idx := len("https://"); len(rawURL) > idx && rawURL[:idx] == "https://" {
		rest = rawURL[idx:]
	} else if idx := len("http://"); len(rawURL) > idx && rawURL[:idx] == "http://" {
		scheme = "http"
		rest = rawURL[idx:]
	}
	if slashIdx := indexByte(rest, '/'); slashIdx > 0 {
		rest = rest[:slashIdx]
	}
	return hostInfo{scheme: scheme, host: rest}, nil
}

func indexByte(s string, b byte) int {
	for i := 0; i < len(s); i++ {
		if s[i] == b {
			return i
		}
	}
	return -1
}
