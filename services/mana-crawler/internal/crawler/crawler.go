package crawler

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manacore/mana-crawler/internal/parser"
	"github.com/manacore/mana-crawler/internal/robots"
)

// CrawlConfig holds configuration for a crawl job.
type CrawlConfig struct {
	MaxDepth       int              `json:"maxDepth"`
	MaxPages       int              `json:"maxPages"`
	RateLimit      int              `json:"rateLimit"` // requests/second
	RespectRobots  bool             `json:"respectRobots"`
	IncludePatterns []string        `json:"includePatterns"`
	ExcludePatterns []string        `json:"excludePatterns"`
	Selectors      *parser.Selectors `json:"selectors"`
	OutputFormat   string           `json:"format"` // text, html, markdown
}

// Progress tracks crawl progress.
type Progress struct {
	Discovered int `json:"discovered"`
	Crawled    int `json:"crawled"`
	Failed     int `json:"failed"`
	Queued     int `json:"queued"`
}

// CrawlJob represents a running crawl job.
type CrawlJob struct {
	ID        string
	StartURL  string
	Domain    string
	Config    CrawlConfig
	Status    string // pending, running, paused, completed, failed, cancelled
	Progress  Progress
	Error     string
	StartedAt *time.Time
	CreatedAt time.Time
}

// Crawler manages crawl jobs.
type Crawler struct {
	pool        *pgxpool.Pool
	robots      *robots.Checker
	httpClient  *http.Client
	userAgent   string
	concurrency int

	mu   sync.RWMutex
	jobs map[string]context.CancelFunc // active job cancellation
}

// New creates a new Crawler.
func New(pool *pgxpool.Pool, robotsChecker *robots.Checker, userAgent string, concurrency int, timeout time.Duration) *Crawler {
	// Skip TLS verification for outgoing crawl requests.
	// Required in Docker Desktop for Mac (TLS proxy) and for crawling
	// sites with self-signed or expired certificates.
	transport := &http.Transport{
		TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	}

	return &Crawler{
		pool:   pool,
		robots: robotsChecker,
		httpClient: &http.Client{
			Timeout:   timeout,
			Transport: transport,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 10 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
		userAgent:   userAgent,
		concurrency: concurrency,
		jobs:        make(map[string]context.CancelFunc),
	}
}

// StartJob begins a new crawl job.
func (c *Crawler) StartJob(ctx context.Context, jobID, startURL string, cfg CrawlConfig) error {
	jobCtx, cancel := context.WithCancel(ctx)

	c.mu.Lock()
	c.jobs[jobID] = cancel
	c.mu.Unlock()

	// Update job status to running
	now := time.Now()
	c.pool.Exec(ctx, `UPDATE crawler.crawl_jobs SET status='running', started_at=$2, updated_at=NOW() WHERE id=$1`, jobID, now)

	go c.runCrawl(jobCtx, jobID, startURL, cfg)
	return nil
}

// CancelJob cancels a running job.
func (c *Crawler) CancelJob(jobID string) {
	c.mu.Lock()
	if cancel, ok := c.jobs[jobID]; ok {
		cancel()
		delete(c.jobs, jobID)
	}
	c.mu.Unlock()
}

func (c *Crawler) runCrawl(ctx context.Context, jobID, startURL string, cfg CrawlConfig) {
	defer func() {
		c.mu.Lock()
		delete(c.jobs, jobID)
		c.mu.Unlock()
	}()

	slog.Info("crawl started", "job", jobID, "url", startURL)

	base, err := url.Parse(startURL)
	if err != nil {
		c.failJob(jobID, "invalid start URL: "+err.Error())
		return
	}

	// Track visited URLs
	visited := &sync.Map{}
	var crawled, failed atomic.Int32

	// Work queue (channel-based instead of BullMQ)
	type workItem struct {
		url       string
		parentURL string
		depth     int
	}

	queue := make(chan workItem, cfg.MaxPages*2)
	queue <- workItem{url: startURL, depth: 0}
	visited.Store(startURL, true)

	// Rate limiter
	delay := time.Duration(float64(time.Second) / float64(cfg.RateLimit))
	ticker := time.NewTicker(delay)
	defer ticker.Stop()

	// Worker pool
	var wg sync.WaitGroup
	sem := make(chan struct{}, c.concurrency)

	done := false
	for !done {
		select {
		case <-ctx.Done():
			c.pool.Exec(context.Background(), `UPDATE crawler.crawl_jobs SET status='cancelled', updated_at=NOW() WHERE id=$1`, jobID)
			slog.Info("crawl cancelled", "job", jobID)
			return

		case item, ok := <-queue:
			if !ok {
				done = true
				break
			}

			if int(crawled.Load()) >= cfg.MaxPages {
				done = true
				break
			}

			// Rate limit
			<-ticker.C

			sem <- struct{}{}
			wg.Add(1)

			go func(item workItem) {
				defer wg.Done()
				defer func() { <-sem }()

				// Check robots.txt
				if cfg.RespectRobots {
					allowed, _ := c.robots.IsAllowed(ctx, item.url)
					if !allowed {
						slog.Debug("blocked by robots.txt", "url", item.url)
						return
					}
				}

				// Fetch and parse
				result, statusCode, fetchErr := c.fetchAndParse(ctx, item.url, base, &cfg)

				if fetchErr != nil {
					failed.Add(1)
					c.saveResult(ctx, jobID, item.url, item.parentURL, item.depth, nil, 0, fetchErr.Error())
				} else {
					crawled.Add(1)
					c.saveResult(ctx, jobID, item.url, item.parentURL, item.depth, result, statusCode, "")

					// Queue discovered links
					if item.depth < cfg.MaxDepth && result != nil {
						for _, link := range result.Links {
							if _, loaded := visited.LoadOrStore(link, true); !loaded {
								if matchesPatterns(link, cfg.IncludePatterns, cfg.ExcludePatterns) {
									select {
									case queue <- workItem{url: link, parentURL: item.url, depth: item.depth + 1}:
									default:
										// Queue full
									}
								}
							}
						}
					}
				}

				// Update progress
				prog := Progress{
					Crawled: int(crawled.Load()),
					Failed:  int(failed.Load()),
				}
				progJSON, _ := json.Marshal(prog)
				c.pool.Exec(ctx, `UPDATE crawler.crawl_jobs SET progress=$2, updated_at=NOW() WHERE id=$1`, jobID, string(progJSON))

			}(item)

		default:
			// If queue is empty and no workers running, we're done
			if len(queue) == 0 {
				// Wait a bit for workers to finish and potentially add more URLs
				time.Sleep(500 * time.Millisecond)
				if len(queue) == 0 {
					done = true
				}
			}
		}
	}

	wg.Wait()

	// Mark completed
	c.pool.Exec(context.Background(), `UPDATE crawler.crawl_jobs SET status='completed', completed_at=NOW(), updated_at=NOW() WHERE id=$1`, jobID)
	slog.Info("crawl completed", "job", jobID, "crawled", crawled.Load(), "failed", failed.Load())
}

func (c *Crawler) fetchAndParse(ctx context.Context, rawURL string, base *url.URL, cfg *CrawlConfig) (*parser.Result, int, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", rawURL, nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("User-Agent", c.userAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml")

	start := time.Now()
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, resp.StatusCode, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if !strings.Contains(contentType, "text/html") && !strings.Contains(contentType, "application/xhtml") {
		return nil, resp.StatusCode, fmt.Errorf("not HTML: %s", contentType)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 10*1024*1024)) // 10MB limit
	if err != nil {
		return nil, resp.StatusCode, err
	}

	_ = time.Since(start) // fetchDuration

	result, err := parser.Parse(string(body), rawURL, cfg.Selectors)
	if err != nil {
		return nil, resp.StatusCode, err
	}

	return result, resp.StatusCode, nil
}

func (c *Crawler) saveResult(ctx context.Context, jobID, url, parentURL string, depth int, result *parser.Result, statusCode int, errMsg string) {
	var title, content, markdown, linksJSON *string
	var metadataJSON *string

	if result != nil {
		if result.Title != "" {
			title = &result.Title
		}
		if result.Content != "" {
			content = &result.Content
		}
		if result.Markdown != "" {
			markdown = &result.Markdown
		}
		if len(result.Links) > 0 {
			b, _ := json.Marshal(result.Links)
			s := string(b)
			linksJSON = &s
		}
		if len(result.Metadata) > 0 {
			b, _ := json.Marshal(result.Metadata)
			s := string(b)
			metadataJSON = &s
		}
	}

	var parentPtr *string
	if parentURL != "" {
		parentPtr = &parentURL
	}
	var errPtr *string
	if errMsg != "" {
		errPtr = &errMsg
	}

	c.pool.Exec(ctx, `
		INSERT INTO crawler.crawl_results (job_id, url, parent_url, depth, title, content, markdown, links, metadata, status_code, error)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, jobID, url, parentPtr, depth, title, content, markdown, linksJSON, metadataJSON, statusCode, errPtr)
}

func (c *Crawler) failJob(jobID, errMsg string) {
	c.pool.Exec(context.Background(), `UPDATE crawler.crawl_jobs SET status='failed', error=$2, updated_at=NOW() WHERE id=$1`, jobID, errMsg)
	slog.Error("crawl failed", "job", jobID, "error", errMsg)
}

func matchesPatterns(u string, include, exclude []string) bool {
	// If include patterns specified, URL must match at least one
	if len(include) > 0 {
		matched := false
		for _, pattern := range include {
			if strings.Contains(u, strings.TrimSuffix(strings.TrimPrefix(pattern, "*"), "*")) {
				matched = true
				break
			}
		}
		if !matched {
			return false
		}
	}

	// If exclude patterns specified, URL must not match any
	for _, pattern := range exclude {
		if strings.Contains(u, strings.TrimSuffix(strings.TrimPrefix(pattern, "*"), "*")) {
			return false
		}
	}

	return true
}
