package plugin

import "strings"

// KeywordCommand maps keywords to a command name.
type KeywordCommand struct {
	Keywords []string // lowercase keywords
	Command  string   // command name to return
}

// KeywordDetector detects commands from natural language keywords.
type KeywordDetector struct {
	commands     []KeywordCommand
	maxLength    int
	partialMatch bool
}

// KeywordDetectorOption configures the detector.
type KeywordDetectorOption func(*KeywordDetector)

// WithMaxLength sets the max message length to check (default: 60).
func WithMaxLength(n int) KeywordDetectorOption {
	return func(d *KeywordDetector) { d.maxLength = n }
}

// WithPartialMatch enables partial word matching.
func WithPartialMatch(enabled bool) KeywordDetectorOption {
	return func(d *KeywordDetector) { d.partialMatch = enabled }
}

// NewKeywordDetector creates a new keyword detector.
func NewKeywordDetector(commands []KeywordCommand, opts ...KeywordDetectorOption) *KeywordDetector {
	d := &KeywordDetector{
		commands:  commands,
		maxLength: 60,
	}
	for _, opt := range opts {
		opt(d)
	}
	return d
}

// Detect returns the command name if a keyword matches, or empty string.
func (d *KeywordDetector) Detect(message string) string {
	lower := strings.ToLower(strings.TrimSpace(message))

	if len(lower) > d.maxLength {
		return ""
	}

	for _, cmd := range d.commands {
		for _, kw := range cmd.Keywords {
			if d.matches(lower, kw) {
				return cmd.Command
			}
		}
	}
	return ""
}

// AddCommands appends more commands dynamically.
func (d *KeywordDetector) AddCommands(commands []KeywordCommand) {
	d.commands = append(d.commands, commands...)
}

func (d *KeywordDetector) matches(message, keyword string) bool {
	// Exact match
	if message == keyword {
		return true
	}
	// Prefix match: keyword followed by space
	if strings.HasPrefix(message, keyword+" ") {
		return true
	}
	// Partial match
	if d.partialMatch && strings.Contains(message, keyword) {
		return true
	}
	return false
}

// CommonKeywords are shared across all bots (German + English).
var CommonKeywords = []KeywordCommand{
	{Keywords: []string{"hilfe", "help", "befehle", "commands", "?"}, Command: "help"},
	{Keywords: []string{"status", "info"}, Command: "status"},
	{Keywords: []string{"abbrechen", "cancel", "stop"}, Command: "cancel"},
}
