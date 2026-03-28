package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSearchHandler_Validation(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantError  string
	}{
		{
			name:       "empty body",
			body:       "",
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid request body",
		},
		{
			name:       "invalid JSON",
			body:       "{invalid}",
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid request body",
		},
		{
			name:       "missing query",
			body:       `{}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "query is required",
		},
		{
			name:       "empty query string",
			body:       `{"query":""}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "query is required",
		},
		{
			name:       "limit too high",
			body:       `{"query":"test","options":{"limit":100}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "limit must be between 1 and 50",
		},
		{
			name:       "negative limit",
			body:       `{"query":"test","options":{"limit":-1}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "limit must be between 1 and 50",
		},
		{
			name:       "invalid safeSearch",
			body:       `{"query":"test","options":{"safeSearch":5}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "safeSearch must be 0, 1, or 2",
		},
	}

	m, c, cfg := testDeps()
	h := &SearchHandler{metrics: m, cache: c, cfg: cfg}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/search", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			rr := httptest.NewRecorder()

			h.Search(rr, req)

			if rr.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", rr.Code, tt.wantStatus)
			}

			var resp map[string]any
			if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			errObj, ok := resp["error"].(map[string]any)
			if !ok {
				t.Fatal("expected error object in response")
			}
			if msg, _ := errObj["message"].(string); msg != tt.wantError {
				t.Errorf("error message = %q, want %q", msg, tt.wantError)
			}
			if success, _ := resp["success"].(bool); success {
				t.Error("expected success=false")
			}
		})
	}
}

func TestSearchHandler_ContentType(t *testing.T) {
	m, c, cfg := testDeps()
	h := &SearchHandler{metrics: m, cache: c, cfg: cfg}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/search", strings.NewReader(`{}`))
	rr := httptest.NewRecorder()

	h.Search(rr, req)

	ct := rr.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}
}
