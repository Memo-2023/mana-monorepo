package handler

import (
	"encoding/json"
	"testing"
)

func TestValidateSendRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     SendRequest
		wantErr string
	}{
		{
			name:    "missing channel",
			req:     SendRequest{AppID: "app1", Recipient: "user@test.com", Body: "hello"},
			wantErr: "channel is required",
		},
		{
			name:    "invalid channel",
			req:     SendRequest{Channel: "sms", AppID: "app1", Recipient: "user@test.com", Body: "hello"},
			wantErr: "channel must be email, push, matrix, or webhook",
		},
		{
			name:    "missing appId",
			req:     SendRequest{Channel: "email", Recipient: "user@test.com", Body: "hello"},
			wantErr: "appId is required",
		},
		{
			name:    "missing recipient and userId",
			req:     SendRequest{Channel: "email", AppID: "app1", Body: "hello"},
			wantErr: "recipient, recipients, or userId is required",
		},
		{
			name:    "missing template and body",
			req:     SendRequest{Channel: "email", AppID: "app1", Recipient: "user@test.com"},
			wantErr: "template or body is required",
		},
		{
			name: "valid with recipient and body",
			req:  SendRequest{Channel: "email", AppID: "app1", Recipient: "user@test.com", Body: "hello"},
		},
		{
			name: "valid with userId and template",
			req:  SendRequest{Channel: "push", AppID: "app1", UserID: "u1", Template: "welcome"},
		},
		{
			name: "valid with recipients",
			req:  SendRequest{Channel: "webhook", AppID: "app1", Recipients: []string{"url1"}, Body: "data"},
		},
		{
			name: "valid email channel",
			req:  SendRequest{Channel: "email", AppID: "app1", Recipient: "a@b.com", Body: "hi"},
		},
		{
			name: "valid push channel",
			req:  SendRequest{Channel: "push", AppID: "app1", Recipient: "token", Body: "hi"},
		},
		{
			name: "valid matrix channel",
			req:  SendRequest{Channel: "matrix", AppID: "app1", Recipient: "!room:server", Body: "hi"},
		},
		{
			name: "valid webhook channel",
			req:  SendRequest{Channel: "webhook", AppID: "app1", Recipient: "https://hook.example.com", Body: "{}"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateSendRequest(&tt.req)
			if tt.wantErr != "" {
				if err == nil {
					t.Fatalf("expected error %q, got nil", tt.wantErr)
				}
				if err.Error() != tt.wantErr {
					t.Fatalf("expected error %q, got %q", tt.wantErr, err.Error())
				}
			} else {
				if err != nil {
					t.Fatalf("expected no error, got %q", err.Error())
				}
			}
		})
	}
}

func TestParseTime(t *testing.T) {
	tests := []struct {
		input string
		wantH int
		wantM int
	}{
		{"22:00", 22, 0},
		{"08:30", 8, 30},
		{"0:00", 0, 0},
		{"23:59", 23, 59},
		{"invalid", 0, 0},
		{"", 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			h, m := parseTime(tt.input)
			if h != tt.wantH || m != tt.wantM {
				t.Fatalf("parseTime(%q) = (%d, %d), want (%d, %d)", tt.input, h, m, tt.wantH, tt.wantM)
			}
		})
	}
}

func TestNilIfEmpty(t *testing.T) {
	tests := []struct {
		name  string
		input string
		isNil bool
	}{
		{"empty string returns nil", "", true},
		{"non-empty returns pointer", "hello", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := nilIfEmpty(tt.input)
			if tt.isNil {
				if result != nil {
					t.Fatal("expected nil, got non-nil")
				}
			} else {
				if result == nil {
					t.Fatal("expected non-nil, got nil")
				}
				if *result != tt.input {
					t.Fatalf("expected %q, got %q", tt.input, *result)
				}
			}
		})
	}
}

func TestJsonOrNil(t *testing.T) {
	tests := []struct {
		name   string
		input  map[string]any
		isNil  bool
		verify func(t *testing.T, b []byte)
	}{
		{
			name:  "nil map returns nil",
			input: nil,
			isNil: true,
		},
		{
			name:  "empty map returns valid JSON",
			input: map[string]any{},
			isNil: false,
			verify: func(t *testing.T, b []byte) {
				var m map[string]any
				if err := json.Unmarshal(b, &m); err != nil {
					t.Fatalf("invalid JSON: %v", err)
				}
				if len(m) != 0 {
					t.Fatalf("expected empty map, got %v", m)
				}
			},
		},
		{
			name:  "map with data returns valid JSON",
			input: map[string]any{"key": "value", "num": float64(42)},
			isNil: false,
			verify: func(t *testing.T, b []byte) {
				var m map[string]any
				if err := json.Unmarshal(b, &m); err != nil {
					t.Fatalf("invalid JSON: %v", err)
				}
				if m["key"] != "value" {
					t.Fatalf("expected key=value, got %v", m["key"])
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := jsonOrNil(tt.input)
			if tt.isNil {
				if result != nil {
					t.Fatal("expected nil, got non-nil")
				}
			} else {
				if result == nil {
					t.Fatal("expected non-nil, got nil")
				}
				if tt.verify != nil {
					tt.verify(t, result)
				}
			}
		})
	}
}
