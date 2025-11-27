// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// Authentication handled via Mana Middleware (client-side)
		}
		interface PageData {
			// Page data types
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
