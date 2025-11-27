// Polyfills for web platform
// This file handles compatibility issues when running in web browser

// Export a mock for @supabase/node-fetch that uses browser fetch
const nodeFetch = (...args) => fetch(...args);
nodeFetch.default = nodeFetch;

export default nodeFetch;
export { nodeFetch as fetch };
