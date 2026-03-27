package plugin

import "fmt"

var registry = make(map[string]func() Plugin)

// Register adds a plugin factory to the registry.
// Called from each plugin's init() function or explicitly in main.
func Register(name string, factory func() Plugin) {
	if _, exists := registry[name]; exists {
		panic(fmt.Sprintf("plugin %q already registered", name))
	}
	registry[name] = factory
}

// All returns all registered plugin factories.
func All() map[string]func() Plugin {
	result := make(map[string]func() Plugin, len(registry))
	for k, v := range registry {
		result[k] = v
	}
	return result
}

// Get returns a plugin factory by name.
func Get(name string) (func() Plugin, bool) {
	f, ok := registry[name]
	return f, ok
}
