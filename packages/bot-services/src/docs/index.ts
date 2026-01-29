// Placeholder - to be implemented
// Will integrate with project documentation generation

export interface DocsServiceConfig {
	openaiApiKey?: string;
	s3Config?: {
		endpoint: string;
		bucket: string;
		accessKey: string;
		secretKey: string;
	};
}

export interface ProjectDoc {
	id: string;
	title: string;
	content: string;
	format: 'blog' | 'summary' | 'technical';
	createdAt: string;
}

// Export placeholder module
export const DocsModule = {
	register: () => ({ module: class {}, providers: [], exports: [] }),
};
