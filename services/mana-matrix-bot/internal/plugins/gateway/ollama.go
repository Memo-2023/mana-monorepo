package gateway

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// OllamaModel represents an available model.
type OllamaModel struct {
	Name string `json:"name"`
	Size int64  `json:"size"`
}

type ollamaModelsResponse struct {
	Models []OllamaModel `json:"models"`
}

type ollamaChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type ollamaChatResponse struct {
	Message ChatMessage `json:"message"`
}

var httpClient = &http.Client{Timeout: 120 * time.Second}

// ollamaChat sends a chat request to the Ollama API.
func ollamaChat(ctx context.Context, baseURL, model string, messages []ChatMessage) (string, error) {
	body := ollamaChatRequest{Model: model, Messages: messages, Stream: false}
	data, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", baseURL+"/api/chat", bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ollama %d: %s", resp.StatusCode, string(b))
	}

	var result ollamaChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Message.Content, nil
}

// ollamaListModels lists available models from the Ollama API.
func ollamaListModels(ctx context.Context, baseURL string) ([]OllamaModel, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", baseURL+"/api/tags", nil)
	if err != nil {
		return nil, err
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("list models: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("list models: %d", resp.StatusCode)
	}

	var result ollamaModelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result.Models, nil
}

// buildMessages constructs the message array for an Ollama chat request.
func buildMessages(session *AISession, userMessage string) []ChatMessage {
	msgs := make([]ChatMessage, 0, len(session.History)+2)

	// System prompt
	prompt := getSystemPrompt(session.Mode)
	if prompt != "" {
		msgs = append(msgs, ChatMessage{Role: "system", Content: prompt})
	}

	// History
	msgs = append(msgs, session.History...)

	// New user message
	msgs = append(msgs, ChatMessage{Role: "user", Content: userMessage})
	return msgs
}

func getSystemPrompt(mode string) string {
	switch mode {
	case "code":
		return "Du bist ein erfahrener Programmierer. Antworte mit klaren Code-Beispielen."
	case "translate":
		return "Du bist ein Übersetzer. Übersetze Deutsch↔Englisch. Gib nur die Übersetzung zurück."
	case "summarize":
		return "Fasse den Text kurz und prägnant zusammen."
	default:
		return "Du bist ein hilfreicher KI-Assistent. Antworte auf Deutsch, außer der Nutzer schreibt auf Englisch."
	}
}
