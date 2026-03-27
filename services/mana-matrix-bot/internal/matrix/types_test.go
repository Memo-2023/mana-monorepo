package matrix

import "testing"

func TestIsBot(t *testing.T) {
	tests := []struct {
		sender string
		want   bool
	}{
		{"@todo-bot:mana.how", true},
		{"@mana-bot:mana.how", true},
		{"@ollama-bot:mana.how", true},
		{"@statsbot:mana.how", true},
		{"@till:mana.how", false},
		{"@user:mana.how", false},
		{"@bot-admin:mana.how", false}, // contains "bot-" not "-bot"
		{"invalid", false},
		{"", false},
	}

	for _, tt := range tests {
		got := IsBot(tt.sender)
		if got != tt.want {
			t.Errorf("IsBot(%q) = %v, want %v", tt.sender, got, tt.want)
		}
	}
}
