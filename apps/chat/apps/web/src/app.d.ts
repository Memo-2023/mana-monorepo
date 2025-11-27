// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// Auth is now handled client-side via Mana Core Auth
		}
		interface PageData {
			pathname?: string;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
