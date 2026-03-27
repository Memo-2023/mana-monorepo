package plugin

import "strings"

// CommandRouter routes !command messages to the right handler.
type CommandRouter struct {
	routes []route
}

type route struct {
	pattern string
	handler CommandHandler
}

// CommandHandler processes a command with its arguments.
type CommandHandler func(ctx *MessageContext, args string) error

// NewCommandRouter creates an empty command router.
func NewCommandRouter() *CommandRouter {
	return &CommandRouter{}
}

// Handle registers a command pattern (e.g., "!todo") with a handler.
func (r *CommandRouter) Handle(pattern string, handler CommandHandler) {
	r.routes = append(r.routes, route{pattern: strings.ToLower(pattern), handler: handler})
}

// Route attempts to match a message to a registered command.
// Returns true if a command was matched and handled.
func (r *CommandRouter) Route(mc *MessageContext) (bool, error) {
	lower := strings.ToLower(mc.Body)

	for _, rt := range r.routes {
		if lower == rt.pattern {
			return true, rt.handler(mc, "")
		}
		if strings.HasPrefix(lower, rt.pattern+" ") {
			args := strings.TrimSpace(mc.Body[len(rt.pattern):])
			return true, rt.handler(mc, args)
		}
	}
	return false, nil
}
