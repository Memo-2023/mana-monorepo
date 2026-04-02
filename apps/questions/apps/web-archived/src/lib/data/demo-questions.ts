/**
 * Demo Questions - Static sample questions for unauthenticated users
 *
 * Shows a realistic set of research questions to demonstrate
 * the app's capabilities without requiring login.
 */

import type { Question, Collection } from '$lib/types';

/**
 * Demo collection for sample questions
 */
export const DEMO_COLLECTION: Collection = {
	id: 'demo-collection',
	userId: 'demo',
	name: 'Tech Research',
	description: 'Sample technology research questions',
	color: '#8b5cf6',
	icon: 'folder',
	isDefault: true,
	sortOrder: 0,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	questionCount: 5,
};

/**
 * Generate demo questions for unauthenticated users
 */
export function generateDemoQuestions(): Question[] {
	const now = new Date();

	return [
		{
			id: 'demo_1',
			userId: 'demo',
			collectionId: DEMO_COLLECTION.id,
			title: 'What are the key differences between React Server Components and traditional SSR?',
			description:
				'I want to understand how RSC differs from traditional server-side rendering approaches and when to use each.',
			status: 'answered',
			priority: 'high',
			tags: ['react', 'ssr', 'web-development'],
			researchDepth: 'deep',
			createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'demo_2',
			userId: 'demo',
			collectionId: DEMO_COLLECTION.id,
			title: 'How does vector database similarity search work under the hood?',
			description:
				'Exploring the algorithms and data structures used in vector databases for semantic search.',
			status: 'researching',
			priority: 'normal',
			tags: ['ai', 'databases', 'embeddings'],
			researchDepth: 'standard',
			createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'demo_3',
			userId: 'demo',
			collectionId: DEMO_COLLECTION.id,
			title: 'What are best practices for implementing OAuth 2.0 with PKCE in mobile apps?',
			description: 'Security considerations and implementation patterns for mobile authentication.',
			status: 'open',
			priority: 'urgent',
			tags: ['security', 'oauth', 'mobile'],
			researchDepth: 'deep',
			createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'demo_4',
			userId: 'demo',
			collectionId: DEMO_COLLECTION.id,
			title: 'How do transformer models handle context length limitations?',
			description:
				'Understanding techniques like sliding window attention, sparse attention, and context compression.',
			status: 'answered',
			priority: 'normal',
			tags: ['ai', 'transformers', 'llm'],
			researchDepth: 'standard',
			createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'demo_5',
			userId: 'demo',
			collectionId: DEMO_COLLECTION.id,
			title: 'What are the trade-offs between monorepo and polyrepo architectures?',
			description:
				'Comparing build systems, dependency management, and team collaboration patterns.',
			status: 'open',
			priority: 'low',
			tags: ['architecture', 'devops', 'tooling'],
			researchDepth: 'quick',
			createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		},
	];
}

/**
 * Check if an ID belongs to a demo question
 */
export function isDemoQuestion(id: string): boolean {
	return id.startsWith('demo_');
}

/**
 * Check if an ID belongs to the demo collection
 */
export function isDemoCollection(id: string): boolean {
	return id === DEMO_COLLECTION.id;
}
