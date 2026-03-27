package extract

import (
	"context"
	"fmt"
	"log/slog"
	"math"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	htmltomarkdown "github.com/JohannesKaufmann/html-to-markdown/v2"
	readability "github.com/go-shiori/go-readability"

	"github.com/manacore/mana-search/internal/config"
)

type Extractor struct {
	timeout   time.Duration
	maxLength int
	userAgent string
}

func New(cfg *config.Config) *Extractor {
	return &Extractor{
		timeout:   time.Duration(cfg.ExtractTimeout) * time.Millisecond,
		maxLength: cfg.ExtractMaxLength,
		userAgent: cfg.ExtractUserAgent,
	}
}

// ExtractRequest from the client.
type ExtractRequest struct {
	URL     string          `json:"url"`
	Options *ExtractOptions `json:"options,omitempty"`
}

type ExtractOptions struct {
	IncludeHTML     bool `json:"includeHtml,omitempty"`
	IncludeMarkdown bool `json:"includeMarkdown,omitempty"`
	MaxLength       int  `json:"maxLength,omitempty"`
	Timeout         int  `json:"timeout,omitempty"`
}

// BulkExtractRequest for multiple URLs.
type BulkExtractRequest struct {
	URLs        []string        `json:"urls"`
	Options     *ExtractOptions `json:"options,omitempty"`
	Concurrency int             `json:"concurrency,omitempty"`
}

// ExtractResponse returned to the client.
type ExtractResponse struct {
	Success bool              `json:"success"`
	Content *ExtractedContent `json:"content,omitempty"`
	Error   string            `json:"error,omitempty"`
	Meta    ExtractMeta       `json:"meta"`
}

type ExtractedContent struct {
	Title         string `json:"title"`
	Description   string `json:"description,omitempty"`
	Author        string `json:"author,omitempty"`
	PublishedDate string `json:"publishedDate,omitempty"`
	SiteName      string `json:"siteName,omitempty"`
	Text          string `json:"text"`
	Markdown      string `json:"markdown,omitempty"`
	HTML          string `json:"html,omitempty"`
	WordCount     int    `json:"wordCount"`
	ReadingTime   int    `json:"readingTime"`
	OgImage       string `json:"ogImage,omitempty"`
}

type ExtractMeta struct {
	URL         string `json:"url"`
	Duration    int64  `json:"duration"`
	Cached      bool   `json:"cached"`
	ContentType string `json:"contentType"`
}

type BulkExtractResponse struct {
	Results []BulkExtractResult `json:"results"`
	Meta    BulkMeta            `json:"meta"`
}

type BulkExtractResult struct {
	URL     string            `json:"url"`
	Success bool              `json:"success"`
	Content *ExtractedContent `json:"content,omitempty"`
	Error   string            `json:"error,omitempty"`
}

type BulkMeta struct {
	Total      int   `json:"total"`
	Successful int   `json:"successful"`
	Failed     int   `json:"failed"`
	Duration   int64 `json:"duration"`
}

// Extract fetches a URL and extracts its content using readability.
func (e *Extractor) Extract(ctx context.Context, req *ExtractRequest) *ExtractResponse {
	start := time.Now()

	timeout := e.timeout
	if req.Options != nil && req.Options.Timeout > 0 {
		timeout = time.Duration(req.Options.Timeout) * time.Millisecond
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	parsedURL, err := url.Parse(req.URL)
	if err != nil {
		return errorResponse(req.URL, "invalid URL", start)
	}

	article, err := readability.FromURL(parsedURL.String(), timeout, func(req *http.Request) {
		req.Header.Set("User-Agent", e.userAgent)
	})
	if err != nil {
		slog.Warn("extraction failed", "url", req.URL, "error", err)
		return errorResponse(req.URL, fmt.Sprintf("extraction failed: %v", err), start)
	}

	text := cleanText(article.TextContent)
	maxLen := e.maxLength
	if req.Options != nil && req.Options.MaxLength > 0 {
		maxLen = req.Options.MaxLength
	}
	if len(text) > maxLen {
		text = text[:maxLen]
	}

	wordCount := countWords(text)
	readingTime := int(math.Ceil(float64(wordCount) / 200.0))

	content := &ExtractedContent{
		Title:         article.Title,
		Description:   article.Excerpt,
		Author:        article.Byline,
		PublishedDate: formatTime(article.PublishedTime),
		SiteName:      article.SiteName,
		Text:          text,
		WordCount:     wordCount,
		ReadingTime:   readingTime,
		OgImage:       article.Image,
	}

	if req.Options != nil && req.Options.IncludeMarkdown && article.Content != "" {
		md, err := htmltomarkdown.ConvertString(article.Content)
		if err == nil {
			content.Markdown = md
		}
	}

	if req.Options != nil && req.Options.IncludeHTML {
		content.HTML = article.Content
	}

	return &ExtractResponse{
		Success: true,
		Content: content,
		Meta: ExtractMeta{
			URL:         req.URL,
			Duration:    time.Since(start).Milliseconds(),
			Cached:      false,
			ContentType: "text/html",
		},
	}
}

// BulkExtract processes multiple URLs with limited concurrency.
func (e *Extractor) BulkExtract(ctx context.Context, req *BulkExtractRequest) *BulkExtractResponse {
	start := time.Now()
	concurrency := 5
	if req.Concurrency > 0 && req.Concurrency <= 10 {
		concurrency = req.Concurrency
	}

	results := make([]BulkExtractResult, len(req.URLs))

	// Process in batches
	for i := 0; i < len(req.URLs); i += concurrency {
		end := i + concurrency
		if end > len(req.URLs) {
			end = len(req.URLs)
		}

		type indexedResult struct {
			index  int
			result *ExtractResponse
		}

		ch := make(chan indexedResult, end-i)
		for j := i; j < end; j++ {
			go func(idx int, u string) {
				r := e.Extract(ctx, &ExtractRequest{URL: u, Options: req.Options})
				ch <- indexedResult{index: idx, result: r}
			}(j, req.URLs[j])
		}

		for j := i; j < end; j++ {
			ir := <-ch
			results[ir.index] = BulkExtractResult{
				URL:     req.URLs[ir.index],
				Success: ir.result.Success,
				Content: ir.result.Content,
				Error:   ir.result.Error,
			}
		}
	}

	successful := 0
	failed := 0
	for _, r := range results {
		if r.Success {
			successful++
		} else {
			failed++
		}
	}

	return &BulkExtractResponse{
		Results: results,
		Meta: BulkMeta{
			Total:      len(req.URLs),
			Successful: successful,
			Failed:     failed,
			Duration:   time.Since(start).Milliseconds(),
		},
	}
}

// BuildCacheKey creates a cache key for extraction results.
func BuildCacheKey(rawURL string) string {
	return "extract:" + rawURL
}

func errorResponse(rawURL, errMsg string, start time.Time) *ExtractResponse {
	return &ExtractResponse{
		Success: false,
		Error:   errMsg,
		Meta: ExtractMeta{
			URL:      rawURL,
			Duration: time.Since(start).Milliseconds(),
		},
	}
}

var (
	reScript     = regexp.MustCompile(`(?is)<script[^>]*>.*?</script>`)
	reStyle      = regexp.MustCompile(`(?is)<style[^>]*>.*?</style>`)
	reTags       = regexp.MustCompile(`<[^>]+>`)
	reWhitespace = regexp.MustCompile(`\s+`)
)

func cleanText(html string) string {
	text := reScript.ReplaceAllString(html, "")
	text = reStyle.ReplaceAllString(text, "")
	text = reTags.ReplaceAllString(text, "")
	text = reWhitespace.ReplaceAllString(text, " ")
	return strings.TrimSpace(text)
}

func countWords(text string) int {
	fields := strings.Fields(text)
	return len(fields)
}

func formatTime(t *time.Time) string {
	if t == nil || t.IsZero() {
		return ""
	}
	return t.Format(time.RFC3339)
}

