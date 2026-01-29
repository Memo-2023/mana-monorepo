// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Polyfills for matrix-js-sdk
	interface Window {
		global: typeof globalThis;
		Buffer: typeof import('buffer').Buffer;
		process: { env: Record<string, string> };
	}
}

export {};
