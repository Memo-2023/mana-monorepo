package channel

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWebhookService_Send(t *testing.T) {
	tests := []struct {
		name       string
		handler    http.HandlerFunc
		msg        WebhookMessage
		wantOK     bool
		wantStatus int
	}{
		{
			name: "successful POST with 200",
			handler: func(w http.ResponseWriter, r *http.Request) {
				if r.Method != http.MethodPost {
					t.Errorf("expected POST, got %s", r.Method)
				}
				if ct := r.Header.Get("Content-Type"); ct != "application/json" {
					t.Errorf("expected Content-Type application/json, got %s", ct)
				}
				if ua := r.Header.Get("User-Agent"); ua != "ManaNotify/1.0" {
					t.Errorf("expected User-Agent ManaNotify/1.0, got %s", ua)
				}
				w.WriteHeader(http.StatusOK)
			},
			msg:        WebhookMessage{Body: map[string]any{"test": true}},
			wantOK:     true,
			wantStatus: 200,
		},
		{
			name: "successful PUT",
			handler: func(w http.ResponseWriter, r *http.Request) {
				if r.Method != http.MethodPut {
					t.Errorf("expected PUT, got %s", r.Method)
				}
				w.WriteHeader(http.StatusOK)
			},
			msg:        WebhookMessage{Method: "PUT", Body: map[string]any{"update": true}},
			wantOK:     true,
			wantStatus: 200,
		},
		{
			name: "custom headers are sent",
			handler: func(w http.ResponseWriter, r *http.Request) {
				if v := r.Header.Get("X-Custom"); v != "test-value" {
					t.Errorf("expected X-Custom=test-value, got %s", v)
				}
				w.WriteHeader(http.StatusOK)
			},
			msg: WebhookMessage{
				Headers: map[string]string{"X-Custom": "test-value"},
				Body:    map[string]any{},
			},
			wantOK:     true,
			wantStatus: 200,
		},
		{
			name: "body is sent as JSON",
			handler: func(w http.ResponseWriter, r *http.Request) {
				body, _ := io.ReadAll(r.Body)
				var m map[string]any
				if err := json.Unmarshal(body, &m); err != nil {
					t.Errorf("body is not valid JSON: %v", err)
				}
				if m["event"] != "test" {
					t.Errorf("expected event=test, got %v", m["event"])
				}
				w.WriteHeader(http.StatusOK)
			},
			msg:        WebhookMessage{Body: map[string]any{"event": "test"}},
			wantOK:     true,
			wantStatus: 200,
		},
		{
			name: "server error returns failure",
			handler: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusInternalServerError)
			},
			msg:        WebhookMessage{Body: map[string]any{}},
			wantOK:     false,
			wantStatus: 500,
		},
		{
			name: "404 returns failure",
			handler: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusNotFound)
			},
			msg:        WebhookMessage{Body: map[string]any{}},
			wantOK:     false,
			wantStatus: 404,
		},
		{
			name: "201 is treated as success",
			handler: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusCreated)
			},
			msg:        WebhookMessage{Body: map[string]any{}},
			wantOK:     true,
			wantStatus: 201,
		},
	}

	svc := NewWebhookService()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv := httptest.NewServer(tt.handler)
			defer srv.Close()

			tt.msg.URL = srv.URL
			result := svc.Send(context.Background(), &tt.msg)

			if result.Success != tt.wantOK {
				t.Fatalf("Success = %v, want %v (error: %s)", result.Success, tt.wantOK, result.Error)
			}
			if tt.wantStatus != 0 && result.StatusCode != tt.wantStatus {
				t.Fatalf("StatusCode = %d, want %d", result.StatusCode, tt.wantStatus)
			}
			if result.DurationMs < 0 {
				t.Fatalf("DurationMs should be >= 0, got %d", result.DurationMs)
			}
		})
	}
}

func TestWebhookService_Send_InvalidURL(t *testing.T) {
	svc := NewWebhookService()
	result := svc.Send(context.Background(), &WebhookMessage{
		URL:  "http://localhost:1", // unreachable port
		Body: map[string]any{},
	})

	if result.Success {
		t.Fatal("expected failure for unreachable URL")
	}
	if result.Error == "" {
		t.Fatal("expected non-empty error")
	}
}

func TestWebhookService_Send_DefaultMethod(t *testing.T) {
	var gotMethod string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotMethod = r.Method
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	svc := NewWebhookService()
	svc.Send(context.Background(), &WebhookMessage{
		URL:  srv.URL,
		Body: map[string]any{},
	})

	if gotMethod != "POST" {
		t.Fatalf("default method should be POST, got %s", gotMethod)
	}
}
