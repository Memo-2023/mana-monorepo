/**
 * uLoad module — collection accessors and guest seed data.
 *
 * Uses table names in the unified DB: links, uloadTags, uloadFolders, linkTags.
 */

import { db } from '$lib/data/database';
import type { LocalLink, LocalTag, LocalFolder, LocalLinkTag } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const linkTable = db.table<LocalLink>('links');
export const uloadTagTable = db.table<LocalTag>('uloadTags');
export const uloadFolderTable = db.table<LocalFolder>('uloadFolders');
export const linkTagTable = db.table<LocalLinkTag>('linkTags');

// ─── Guest Seed ────────────────────────────────────────────

export const ULOAD_GUEST_SEED = {
	uloadFolders: [
		{
			id: 'folder-personal',
			name: 'Persoenlich',
			color: '#3b82f6',
			order: 0,
		},
		{
			id: 'folder-work',
			name: 'Arbeit',
			color: '#10b981',
			order: 1,
		},
	] satisfies LocalFolder[],
	uloadTags: [
		{
			id: 'tag-social',
			name: 'Social Media',
			slug: 'social-media',
			color: '#8b5cf6',
			icon: null,
			isPublic: false,
			usageCount: 2,
		},
		{
			id: 'tag-docs',
			name: 'Dokumentation',
			slug: 'dokumentation',
			color: '#f59e0b',
			icon: null,
			isPublic: false,
			usageCount: 1,
		},
		{
			id: 'tag-marketing',
			name: 'Marketing',
			slug: 'marketing',
			color: '#ef4444',
			icon: null,
			isPublic: false,
			usageCount: 1,
		},
	] satisfies LocalTag[],
	links: [
		{
			id: 'link-welcome',
			shortCode: 'welcome',
			originalUrl: 'https://ulo.ad',
			title: 'Willkommen bei uLoad!',
			description: 'Dein erster gekuerzter Link.',
			isActive: true,
			clickCount: 42,
			folderId: 'folder-personal',
			order: 0,
		},
		{
			id: 'link-github',
			shortCode: 'gh-demo',
			originalUrl: 'https://github.com',
			title: 'GitHub',
			description: 'Beispiel-Link mit Tags',
			isActive: true,
			clickCount: 15,
			folderId: 'folder-work',
			order: 0,
		},
		{
			id: 'link-docs',
			shortCode: 'docs',
			originalUrl: 'https://docs.example.com/getting-started',
			title: 'Dokumentation',
			description: 'Link mit UTM-Tracking',
			isActive: true,
			clickCount: 8,
			utmSource: 'newsletter',
			utmMedium: 'email',
			utmCampaign: 'onboarding',
			folderId: 'folder-work',
			order: 1,
		},
		{
			id: 'link-expired',
			shortCode: 'old-promo',
			originalUrl: 'https://example.com/promo',
			title: 'Abgelaufene Promotion',
			description: 'Dieser Link ist deaktiviert.',
			isActive: false,
			clickCount: 234,
			folderId: 'folder-personal',
			order: 1,
		},
	] satisfies LocalLink[],
	linkTags: [
		{ id: 'lt-1', linkId: 'link-github', tagId: 'tag-social' },
		{ id: 'lt-2', linkId: 'link-docs', tagId: 'tag-docs' },
		{ id: 'lt-3', linkId: 'link-welcome', tagId: 'tag-social' },
		{ id: 'lt-4', linkId: 'link-expired', tagId: 'tag-marketing' },
	] satisfies LocalLinkTag[],
};
