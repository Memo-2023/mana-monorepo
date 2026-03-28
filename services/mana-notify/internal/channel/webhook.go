package channel

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"
)

type WebhookService struct {
	client *http.Client
}

func NewWebhookService() *WebhookService {
	return &WebhookService{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

type WebhookMessage struct {
	URL     string
	Method  string // POST or PUT
	Headers map[string]string
	Body    map[string]any
	Timeout int // ms
}

type WebhookResult struct {
	Success    bool
	StatusCode int
	Error      string
	DurationMs int
}

func (s *WebhookService) Send(ctx context.Context, msg *WebhookMessage) WebhookResult {
	start := time.Now()

	method := msg.Method
	if method == "" {
		method = http.MethodPost
	}

	timeout := 10 * time.Second
	if msg.Timeout > 0 {
		timeout = time.Duration(msg.Timeout) * time.Millisecond
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	body, err := json.Marshal(msg.Body)
	if err != nil {
		return WebhookResult{Success: false, Error: "marshal error", DurationMs: int(time.Since(start).Milliseconds())}
	}

	req, err := http.NewRequestWithContext(ctx, method, msg.URL, bytes.NewReader(body))
	if err != nil {
		return WebhookResult{Success: false, Error: err.Error(), DurationMs: int(time.Since(start).Milliseconds())}
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "ManaNotify/1.0")
	for k, v := range msg.Headers {
		req.Header.Set(k, v)
	}

	resp, err := s.client.Do(req)
	durationMs := int(time.Since(start).Milliseconds())
	if err != nil {
		slog.Error("webhook send failed", "url", msg.URL, "error", err)
		return WebhookResult{Success: false, Error: err.Error(), DurationMs: durationMs}
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)

	success := resp.StatusCode >= 200 && resp.StatusCode < 300
	if !success {
		return WebhookResult{
			Success:    false,
			StatusCode: resp.StatusCode,
			Error:      fmt.Sprintf("webhook returned %d", resp.StatusCode),
			DurationMs: durationMs,
		}
	}

	return WebhookResult{Success: true, StatusCode: resp.StatusCode, DurationMs: durationMs}
}
