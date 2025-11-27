// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

interface NewsUser {
	id: string;
	email: string;
	name?: string;
	createdAt: string;
}

interface NewsSession {
	token: string;
	userId: string;
	expiresAt: string;
}

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: NewsSession | null;
			user: NewsUser | null;
		}
		interface PageData {
			session: NewsSession | null;
			user: NewsUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
