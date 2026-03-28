package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestExtractHandler_Validation(t *testing.T) {
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
			body:       "not json",
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid request body",
		},
		{
			name:       "missing url",
			body:       `{}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "url is required",
		},
		{
			name:       "empty url",
			body:       `{"url":""}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "url is required",
		},
		{
			name:       "invalid url",
			body:       `{"url":"not-a-url"}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "url must be a valid URL",
		},
		{
			name:       "maxLength too small",
			body:       `{"url":"https://example.com","options":{"maxLength":50}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "maxLength must be between 100 and 100000",
		},
		{
			name:       "maxLength too large",
			body:       `{"url":"https://example.com","options":{"maxLength":200000}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "maxLength must be between 100 and 100000",
		},
		{
			name:       "timeout too small",
			body:       `{"url":"https://example.com","options":{"timeout":500}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "timeout must be between 1000 and 30000",
		},
		{
			name:       "timeout too large",
			body:       `{"url":"https://example.com","options":{"timeout":60000}}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "timeout must be between 1000 and 30000",
		},
	}

	m, c, cfg := testDeps()
	h := &ExtractHandler{metrics: m, cache: c, cfg: cfg}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/extract", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			rr := httptest.NewRecorder()

			h.Extract(rr, req)

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
		})
	}
}

func TestBulkExtractHandler_Validation(t *testing.T) {
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
			name:       "empty urls array",
			body:       `{"urls":[]}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "urls is required",
		},
		{
			name:       "too many urls",
			body:       `{"urls":["https://1.com","https://2.com","https://3.com","https://4.com","https://5.com","https://6.com","https://7.com","https://8.com","https://9.com","https://10.com","https://11.com","https://12.com","https://13.com","https://14.com","https://15.com","https://16.com","https://17.com","https://18.com","https://19.com","https://20.com","https://21.com"]}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "maximum 20 URLs allowed",
		},
		{
			name:       "invalid url in list",
			body:       `{"urls":["https://valid.com","not-valid"]}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid URL: not-valid",
		},
	}

	m, c, cfg := testDeps()
	h := &ExtractHandler{metrics: m, cache: c, cfg: cfg}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/extract/bulk", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			rr := httptest.NewRecorder()

			h.BulkExtract(rr, req)

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
		})
	}
}

func TestExtractHandler_ContentType(t *testing.T) {
	m, c, cfg := testDeps()
	h := &ExtractHandler{metrics: m, cache: c, cfg: cfg}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/extract", strings.NewReader(`{}`))
	rr := httptest.NewRecorder()

	h.Extract(rr, req)

	ct := rr.Header().Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", ct)
	}
}
