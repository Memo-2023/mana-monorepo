package matrix

import (
	"strings"

	"maunium.net/go/mautrix/event"
)

// IsTextMessage checks if an event is a text message.
func IsTextMessage(evt *event.Event) bool {
	content, ok := evt.Content.Parsed.(*event.MessageEventContent)
	if !ok {
		return false
	}
	return content.MsgType == event.MsgText
}

// IsAudioMessage checks if an event is an audio message.
func IsAudioMessage(evt *event.Event) bool {
	content, ok := evt.Content.Parsed.(*event.MessageEventContent)
	if !ok {
		return false
	}
	return content.MsgType == event.MsgAudio
}

// IsImageMessage checks if an event is an image message.
func IsImageMessage(evt *event.Event) bool {
	content, ok := evt.Content.Parsed.(*event.MessageEventContent)
	if !ok {
		return false
	}
	return content.MsgType == event.MsgImage
}

// IsEditEvent checks if an event is a message edit (m.replace).
func IsEditEvent(evt *event.Event) bool {
	content, ok := evt.Content.Parsed.(*event.MessageEventContent)
	if !ok {
		return false
	}
	return content.RelatesTo != nil && content.RelatesTo.Type == event.RelReplace
}

// IsBot checks if a sender is a bot based on localpart naming convention.
func IsBot(sender string) bool {
	// Extract localpart from @user:server format
	if !strings.HasPrefix(sender, "@") {
		return false
	}
	colonIdx := strings.Index(sender, ":")
	if colonIdx == -1 {
		return false
	}
	localpart := strings.ToLower(sender[1:colonIdx])
	return strings.Contains(localpart, "-bot") || strings.HasSuffix(localpart, "bot")
}

// GetMessageBody extracts the text body from a message event.
func GetMessageBody(evt *event.Event) string {
	content, ok := evt.Content.Parsed.(*event.MessageEventContent)
	if !ok {
		return ""
	}
	return strings.TrimSpace(content.Body)
}

// GetMediaURL extracts the mxc:// URL from a media message event.
func GetMediaURL(evt *event.Event) string {
	content, ok := evt.Content.Parsed.(*event.MessageEventContent)
	if !ok {
		return ""
	}
	return string(content.URL)
}
