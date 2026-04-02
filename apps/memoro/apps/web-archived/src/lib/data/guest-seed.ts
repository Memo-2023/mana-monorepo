/**
 * Guest seed data for Memoro.
 * Shown to users who haven't signed in yet.
 */

import type { LocalMemo, LocalTag } from './local-store.js';

export const guestTags: Omit<LocalTag, 'serverId' | 'syncStatus' | 'updatedAt'>[] = [
	{
		id: 'guest-tag-1',
		name: 'Work',
		color: '#3b82f6',
		isPinned: true,
		sortOrder: 0,
		createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
	},
	{
		id: 'guest-tag-2',
		name: 'Ideas',
		color: '#8b5cf6',
		isPinned: false,
		sortOrder: 1,
		createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
	},
	{
		id: 'guest-tag-3',
		name: 'Personal',
		color: '#10b981',
		isPinned: false,
		sortOrder: 2,
		createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
	},
];

export const guestMemos: Omit<LocalMemo, 'serverId' | 'syncStatus' | 'updatedAt'>[] = [
	{
		id: 'guest-memo-1',
		title: 'Team Meeting Notes',
		intro: 'Discussed Q3 roadmap and upcoming feature releases.',
		transcript:
			'We started with a review of the current sprint. The team agreed on prioritizing the new dashboard redesign. Sarah will handle the frontend, and Tom is leading backend infrastructure. Next meeting is scheduled for Friday.',
		audioDurationMs: 183000,
		processingStatus: 'completed',
		isArchived: false,
		isPinned: true,
		isPublic: false,
		blueprintId: null,
		language: 'en',
		source: {
			primaryLanguage: 'en',
			processing: {
				transcription: { status: 'completed' },
				headlineAndIntro: { status: 'completed' },
			},
		},
		createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
	},
	{
		id: 'guest-memo-2',
		title: 'Product Idea: Offline Mode',
		intro: 'Voice note about implementing offline-first architecture.',
		transcript:
			'Just had an idea while commuting. What if we built the app to work completely offline? Users could record memos without internet, and sync later. This would be huge for people in areas with poor connectivity. Need to research local-first databases — maybe something like Dexie.js or PouchDB.',
		audioDurationMs: 97000,
		processingStatus: 'completed',
		isArchived: false,
		isPinned: false,
		isPublic: false,
		blueprintId: null,
		language: 'en',
		source: {
			primaryLanguage: 'en',
			processing: {
				transcription: { status: 'completed' },
				headlineAndIntro: { status: 'completed' },
			},
		},
		createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
	},
	{
		id: 'guest-memo-3',
		title: 'Morning Reflection',
		intro: null,
		transcript: null,
		audioDurationMs: 45000,
		processingStatus: 'processing',
		isArchived: false,
		isPinned: false,
		isPublic: false,
		blueprintId: null,
		language: 'de',
		source: {
			primaryLanguage: 'de',
			processing: {
				transcription: { status: 'processing' },
				headlineAndIntro: { status: 'pending' },
			},
		},
		createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
	},
];
