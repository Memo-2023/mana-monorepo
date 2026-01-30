/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		__PUBLIC_MANA_CORE_AUTH_URL__?: string;
		__PUBLIC_MANA_LLM_URL__?: string;
	}
}

export {};
