package channel

import "testing"

func TestIsExpoPushToken(t *testing.T) {
	tests := []struct {
		token string
		want  bool
	}{
		{"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]", true},
		{"ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]", true},
		{"ExponentPushToken[abc123]", true},
		{"ExpoPushToken[abc123]", true},
		{"ExponentPushToken[]", true},
		{"", false},
		{"some-random-token", false},
		{"Bearer ExponentPushToken[abc]", false},
		{"exponentpushtoken[abc]", false}, // case sensitive
		{"ExpoPush[abc]", false},
		{"fcm:token123", false},
	}

	for _, tt := range tests {
		t.Run(tt.token, func(t *testing.T) {
			got := IsExpoPushToken(tt.token)
			if got != tt.want {
				t.Fatalf("IsExpoPushToken(%q) = %v, want %v", tt.token, got, tt.want)
			}
		})
	}
}
