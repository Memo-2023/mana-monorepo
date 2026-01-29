// Placeholder - to be implemented
// Will integrate with Zitare backend API

export interface QuotesServiceConfig {
	apiUrl: string;
}

export interface Quote {
	id: string;
	text: string;
	author: string;
	category: string;
}

// Export placeholder module
export const QuotesModule = {
	register: () => ({ module: class {}, providers: [], exports: [] }),
};
