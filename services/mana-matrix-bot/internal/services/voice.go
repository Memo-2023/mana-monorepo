package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// VoiceClient handles STT and TTS requests to the Python services.
type VoiceClient struct {
	sttURL     string
	ttsURL     string
	httpClient *http.Client
}

// TranscriptionResult holds the STT response.
type TranscriptionResult struct {
	Text     string  `json:"text"`
	Language string  `json:"language"`
	Duration float64 `json:"duration"`
}

// NewVoiceClient creates a new voice service client.
func NewVoiceClient(sttURL, ttsURL string) *VoiceClient {
	return &VoiceClient{
		sttURL: sttURL,
		ttsURL: ttsURL,
		httpClient: &http.Client{
			Timeout: 120 * time.Second, // STT/TTS can be slow
		},
	}
}

// Transcribe sends audio data to the STT service and returns the transcription.
func (c *VoiceClient) Transcribe(ctx context.Context, audioData []byte, language string) (*TranscriptionResult, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	part, err := writer.CreateFormFile("file", "audio.ogg")
	if err != nil {
		return nil, fmt.Errorf("create form file: %w", err)
	}
	if _, err := part.Write(audioData); err != nil {
		return nil, fmt.Errorf("write audio: %w", err)
	}

	if language != "" {
		if err := writer.WriteField("language", language); err != nil {
			return nil, fmt.Errorf("write language: %w", err)
		}
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("close writer: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.sttURL+"/transcribe", &buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("STT request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("STT error %d: %s", resp.StatusCode, string(body))
	}

	var result TranscriptionResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode STT response: %w", err)
	}
	return &result, nil
}

// Synthesize sends text to the TTS service and returns audio data.
func (c *VoiceClient) Synthesize(ctx context.Context, text string, voice string) ([]byte, error) {
	payload := map[string]any{
		"text": text,
	}
	if voice != "" {
		payload["voice"] = voice
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.ttsURL+"/synthesize", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("TTS request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("TTS error %d: %s", resp.StatusCode, string(body))
	}

	return io.ReadAll(resp.Body)
}
