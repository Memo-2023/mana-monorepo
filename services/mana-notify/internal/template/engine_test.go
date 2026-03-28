package template

import "testing"

func TestRenderDirect(t *testing.T) {
	tests := []struct {
		name    string
		tmpl    string
		data    map[string]any
		want    string
		wantErr bool
	}{
		{
			name: "simple variable substitution",
			tmpl: "Hello {{.name}}!",
			data: map[string]any{"name": "Till"},
			want: "Hello Till!",
		},
		{
			name: "multiple variables",
			tmpl: "{{.greeting}}, {{.name}}! Your code is {{.code}}.",
			data: map[string]any{"greeting": "Hi", "name": "User", "code": "ABC123"},
			want: "Hi, User! Your code is ABC123.",
		},
		{
			name: "no variables",
			tmpl: "Static text here",
			data: map[string]any{},
			want: "Static text here",
		},
		{
			name: "nil data",
			tmpl: "No data needed",
			data: nil,
			want: "No data needed",
		},
		{
			name: "conditional",
			tmpl: "{{if .show}}visible{{else}}hidden{{end}}",
			data: map[string]any{"show": true},
			want: "visible",
		},
		{
			name: "conditional false",
			tmpl: "{{if .show}}visible{{else}}hidden{{end}}",
			data: map[string]any{"show": false},
			want: "hidden",
		},
		{
			name:    "invalid template syntax",
			tmpl:    "{{.name",
			data:    map[string]any{"name": "test"},
			wantErr: true,
		},
		{
			name: "HTML content preserved",
			tmpl: "<h1>{{.title}}</h1><p>{{.body}}</p>",
			data: map[string]any{"title": "Welcome", "body": "Hello world"},
			want: "<h1>Welcome</h1><p>Hello world</p>",
		},
		{
			name: "email template pattern",
			tmpl: "Hallo {{.userName}}, klicke hier: {{.resetUrl}}",
			data: map[string]any{"userName": "Max", "resetUrl": "https://mana.how/reset/abc"},
			want: "Hallo Max, klicke hier: https://mana.how/reset/abc",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := RenderDirect(tt.tmpl, tt.data)
			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("got %q, want %q", got, tt.want)
			}
		})
	}
}
