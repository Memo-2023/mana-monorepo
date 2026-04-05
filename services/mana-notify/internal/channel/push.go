package channel

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/mana/mana-notify/internal/config"
)

const expoPushURL = "https://exp.host/--/api/v2/push/send"

type PushService struct {
	accessToken string
	client      *http.Client
}

func NewPushService(cfg *config.Config) *PushService {
	return &PushService{
		accessToken: cfg.ExpoAccessToken,
		client:      &http.Client{Timeout: 30 * time.Second},
	}
}

type PushMessage struct {
	To        string         `json:"to"`
	Title     string         `json:"title,omitempty"`
	Body      string         `json:"body"`
	Data      map[string]any `json:"data,omitempty"`
	Sound     string         `json:"sound,omitempty"`
	Badge     *int           `json:"badge,omitempty"`
	ChannelID string         `json:"channelId,omitempty"`
}

type PushResult struct {
	Success  bool
	TicketID string
	Error    string
}

func (s *PushService) IsConfigured() bool {
	return s.accessToken != ""
}

// IsExpoPushToken validates Expo token format.
func IsExpoPushToken(token string) bool {
	return strings.HasPrefix(token, "ExponentPushToken[") || strings.HasPrefix(token, "ExpoPushToken[")
}

// SendToTokens sends push notifications in batches of 100 (Expo limit).
func (s *PushService) SendToTokens(ctx context.Context, tokens []string, title, body string, data map[string]any, sound string, badge *int) map[string]PushResult {
	results := make(map[string]PushResult, len(tokens))

	if !s.IsConfigured() {
		for _, t := range tokens {
			results[t] = PushResult{Success: false, Error: "Expo not configured"}
		}
		return results
	}

	// Build messages
	messages := make([]PushMessage, 0, len(tokens))
	for _, token := range tokens {
		messages = append(messages, PushMessage{
			To:    token,
			Title: title,
			Body:  body,
			Data:  data,
			Sound: sound,
			Badge: badge,
		})
	}

	// Chunk into batches of 100
	for i := 0; i < len(messages); i += 100 {
		end := i + 100
		if end > len(messages) {
			end = len(messages)
		}
		chunk := messages[i:end]

		batchResults := s.sendBatch(ctx, chunk)
		for token, result := range batchResults {
			results[token] = result
		}
	}

	return results
}

func (s *PushService) sendBatch(ctx context.Context, messages []PushMessage) map[string]PushResult {
	results := make(map[string]PushResult, len(messages))

	body, err := json.Marshal(messages)
	if err != nil {
		for _, m := range messages {
			results[m.To] = PushResult{Success: false, Error: "marshal error"}
		}
		return results
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, expoPushURL, bytes.NewReader(body))
	if err != nil {
		for _, m := range messages {
			results[m.To] = PushResult{Success: false, Error: "request error"}
		}
		return results
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if s.accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+s.accessToken)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		slog.Error("expo push failed", "error", err)
		for _, m := range messages {
			results[m.To] = PushResult{Success: false, Error: err.Error()}
		}
		return results
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var expoResp struct {
		Data []struct {
			Status  string `json:"status"`
			ID      string `json:"id"`
			Message string `json:"message"`
			Details struct {
				Error string `json:"error"`
			} `json:"details"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &expoResp); err != nil {
		for _, m := range messages {
			results[m.To] = PushResult{Success: false, Error: fmt.Sprintf("decode error: %s", err)}
		}
		return results
	}

	for i, ticket := range expoResp.Data {
		if i >= len(messages) {
			break
		}
		token := messages[i].To
		if ticket.Status == "ok" {
			results[token] = PushResult{Success: true, TicketID: ticket.ID}
		} else {
			errMsg := ticket.Message
			if ticket.Details.Error != "" {
				errMsg = ticket.Details.Error
			}
			results[token] = PushResult{Success: false, Error: errMsg}
		}
	}

	return results
}
