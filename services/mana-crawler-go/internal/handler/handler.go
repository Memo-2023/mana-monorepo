package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/manacore/mana-crawler/internal/crawler"
)

// Handler serves the crawler HTTP API.
type Handler struct {
	pool    *pgxpool.Pool
	crawler *crawler.Crawler
}

// NewHandler creates a new handler.
func NewHandler(pool *pgxpool.Pool, c *crawler.Crawler) *Handler {
	return &Handler{pool: pool, crawler: c}
}

// StartCrawl handles POST /api/v1/crawl
func (h *Handler) StartCrawl(w http.ResponseWriter, r *http.Request) {
	var body struct {
		StartURL   string               `json:"startUrl"`
		Config     *crawler.CrawlConfig `json:"config"`
		WebhookURL string               `json:"webhookUrl"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}

	if body.StartURL == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "startUrl is required"})
		return
	}

	parsed, err := url.Parse(body.StartURL)
	if err != nil || parsed.Host == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid URL"})
		return
	}

	// Defaults
	cfg := crawler.CrawlConfig{
		MaxDepth:      3,
		MaxPages:      100,
		RateLimit:     2,
		RespectRobots: true,
		OutputFormat:  "markdown",
	}
	if body.Config != nil {
		if body.Config.MaxDepth > 0 {
			cfg.MaxDepth = body.Config.MaxDepth
		}
		if body.Config.MaxPages > 0 {
			cfg.MaxPages = body.Config.MaxPages
		}
		if body.Config.RateLimit > 0 {
			cfg.RateLimit = body.Config.RateLimit
		}
		cfg.RespectRobots = body.Config.RespectRobots
		cfg.IncludePatterns = body.Config.IncludePatterns
		cfg.ExcludePatterns = body.Config.ExcludePatterns
		cfg.Selectors = body.Config.Selectors
		if body.Config.OutputFormat != "" {
			cfg.OutputFormat = body.Config.OutputFormat
		}
	}

	// Insert job
	var jobID string
	configJSON, _ := json.Marshal(cfg)
	err = h.pool.QueryRow(r.Context(), `
		INSERT INTO crawler.crawl_jobs (start_url, domain, max_depth, max_pages, rate_limit, respect_robots, selectors, output, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
		RETURNING id
	`, body.StartURL, parsed.Host, cfg.MaxDepth, cfg.MaxPages, cfg.RateLimit, cfg.RespectRobots,
		string(configJSON), fmt.Sprintf(`{"format":"%s"}`, cfg.OutputFormat)).Scan(&jobID)
	if err != nil {
		slog.Error("create job failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create job"})
		return
	}

	// Start crawl (use background context so it outlives the HTTP request)
	if err := h.crawler.StartJob(context.Background(), jobID, body.StartURL, cfg); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to start crawl"})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"jobId":    jobID,
		"status":   "running",
		"startUrl": body.StartURL,
		"domain":   parsed.Host,
		"config":   cfg,
	})
}

// GetJob handles GET /api/v1/crawl/{jobId}
func (h *Handler) GetJob(w http.ResponseWriter, r *http.Request) {
	jobID := r.PathValue("jobId")

	var job struct {
		ID          string     `json:"jobId"`
		StartURL    string     `json:"startUrl"`
		Domain      string     `json:"domain"`
		Status      string     `json:"status"`
		Progress    string     `json:"progress"`
		Error       *string    `json:"error"`
		StartedAt   *time.Time `json:"startedAt"`
		CompletedAt *time.Time `json:"completedAt"`
		CreatedAt   time.Time  `json:"createdAt"`
	}

	err := h.pool.QueryRow(r.Context(), `
		SELECT id, start_url, domain, status, COALESCE(progress::text, '{}'), error, started_at, completed_at, created_at
		FROM crawler.crawl_jobs WHERE id = $1
	`, jobID).Scan(&job.ID, &job.StartURL, &job.Domain, &job.Status, &job.Progress, &job.Error, &job.StartedAt, &job.CompletedAt, &job.CreatedAt)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "job not found"})
		return
	}

	writeJSON(w, http.StatusOK, job)
}

// GetJobResults handles GET /api/v1/crawl/{jobId}/results
func (h *Handler) GetJobResults(w http.ResponseWriter, r *http.Request) {
	jobID := r.PathValue("jobId")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	// Count total
	var total int
	h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM crawler.crawl_results WHERE job_id = $1`, jobID).Scan(&total)

	rows, err := h.pool.Query(r.Context(), `
		SELECT id, url, parent_url, depth, title, content, markdown, links, metadata, status_code, error, created_at
		FROM crawler.crawl_results WHERE job_id = $1 ORDER BY created_at LIMIT $2 OFFSET $3
	`, jobID, limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "query failed"})
		return
	}
	defer rows.Close()

	var results []map[string]any
	for rows.Next() {
		var id, u string
		var parentURL, title, content, markdown, links, metadata, errMsg *string
		var depth, statusCode int
		var createdAt time.Time

		rows.Scan(&id, &u, &parentURL, &depth, &title, &content, &markdown, &links, &metadata, &statusCode, &errMsg, &createdAt)
		results = append(results, map[string]any{
			"id": id, "url": u, "parentUrl": parentURL, "depth": depth,
			"title": title, "content": content, "markdown": markdown,
			"links": links, "metadata": metadata,
			"statusCode": statusCode, "error": errMsg, "createdAt": createdAt,
		})
	}

	if results == nil {
		results = []map[string]any{}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"results": results,
		"pagination": map[string]any{
			"page": page, "limit": limit, "total": total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// ListJobs handles GET /api/v1/crawl
func (h *Handler) ListJobs(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	status := r.URL.Query().Get("status")

	var total int
	if status != "" {
		h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM crawler.crawl_jobs WHERE status=$1`, status).Scan(&total)
	} else {
		h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM crawler.crawl_jobs`).Scan(&total)
	}

	query := `SELECT id, start_url, domain, status, COALESCE(progress::text,'{}'), created_at FROM crawler.crawl_jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	args := []any{limit, offset}
	if status != "" {
		query = `SELECT id, start_url, domain, status, COALESCE(progress::text,'{}'), created_at FROM crawler.crawl_jobs WHERE status=$3 ORDER BY created_at DESC LIMIT $1 OFFSET $2`
		args = append(args, status)
	}

	rows, err := h.pool.Query(r.Context(), query, args...)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "query failed"})
		return
	}
	defer rows.Close()

	var jobs []map[string]any
	for rows.Next() {
		var id, startURL, domain, st, progress string
		var createdAt time.Time
		rows.Scan(&id, &startURL, &domain, &st, &progress, &createdAt)
		jobs = append(jobs, map[string]any{
			"jobId": id, "startUrl": startURL, "domain": domain,
			"status": st, "progress": progress, "createdAt": createdAt,
		})
	}
	if jobs == nil {
		jobs = []map[string]any{}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"results": jobs,
		"pagination": map[string]any{
			"page": page, "limit": limit, "total": total,
		},
	})
}

// CancelJob handles DELETE /api/v1/crawl/{jobId}
func (h *Handler) CancelJob(w http.ResponseWriter, r *http.Request) {
	jobID := r.PathValue("jobId")
	h.crawler.CancelJob(jobID)
	h.pool.Exec(r.Context(), `UPDATE crawler.crawl_jobs SET status='cancelled', updated_at=NOW() WHERE id=$1`, jobID)
	w.WriteHeader(http.StatusNoContent)
}

// Health handles GET /health
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	dbOK := "ok"
	if err := h.pool.Ping(r.Context()); err != nil {
		dbOK = "error"
	}
	status := "ok"
	if dbOK != "ok" {
		status = "degraded"
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"status": status, "service": "mana-crawler", "database": dbOK,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// Metrics handles GET /metrics
func (h *Handler) Metrics(w http.ResponseWriter, r *http.Request) {
	var running, completed, failed int
	h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM crawler.crawl_jobs WHERE status='running'`).Scan(&running)
	h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM crawler.crawl_jobs WHERE status='completed'`).Scan(&completed)
	h.pool.QueryRow(r.Context(), `SELECT COUNT(*) FROM crawler.crawl_jobs WHERE status='failed'`).Scan(&failed)

	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprintf(w, "# HELP mana_crawler_jobs Crawl jobs by status\n")
	fmt.Fprintf(w, "# TYPE mana_crawler_jobs gauge\n")
	fmt.Fprintf(w, "mana_crawler_jobs{status=\"running\"} %d\n", running)
	fmt.Fprintf(w, "mana_crawler_jobs{status=\"completed\"} %d\n", completed)
	fmt.Fprintf(w, "mana_crawler_jobs{status=\"failed\"} %d\n", failed)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
