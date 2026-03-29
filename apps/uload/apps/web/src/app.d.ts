// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			locale: 'en' | 'de' | 'es' | 'fr' | 'it';
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
