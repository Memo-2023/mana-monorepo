/**
 * Reactive Queries & Pure Helpers for uLoad module.
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs).
 */

import { liveQuery } from 'dexie';
import { deriveUpdatedAt } from '$lib/data/sync';
import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecord, decryptRecords } from '$lib/data/crypto';
import type { LocalLink, LocalTag, LocalFolder, LocalLinkTag } from './types';

// ─── Shared View Types ────────────────────────────────────

export interface Link {
	id: string;
	shortCode: string;
	customCode?: string;
	originalUrl: string;
	title?: string;
	description?: string;
	isActive: boolean;
	password?: string;
	maxClicks?: number;
	expiresAt?: string;
	clickCount: number;
	qrCodeUrl?: string;
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	folderId?: string;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface Tag {
	id: string;
	name: string;
	slug: string;
	color?: string;
	icon?: string;
	visibility: import('@mana/shared-privacy').VisibilityLevel;
	usageCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface Folder {
	id: string;
	name: string;
	color?: string;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface LinkTag {
	id: string;
	linkId: string;
	tagId: string;
}

export type StatusFilter = 'all' | 'active' | 'inactive';

export interface LinkFilterCriteria {
	search?: string;
	status?: StatusFilter;
	folderId?: string | null;
}

// ─── Type Converters ───────────────────────────────────────

export function toLink(local: LocalLink): Link {
	return {
		id: local.id,
		shortCode: local.shortCode,
		customCode: local.customCode ?? undefined,
		originalUrl: local.originalUrl,
		title: local.title ?? undefined,
		description: local.description ?? undefined,
		isActive: local.isActive,
		password: local.password ?? undefined,
		maxClicks: local.maxClicks ?? undefined,
		expiresAt: local.expiresAt ?? undefined,
		clickCount: local.clickCount,
		qrCodeUrl: local.qrCodeUrl ?? undefined,
		utmSource: local.utmSource ?? undefined,
		utmMedium: local.utmMedium ?? undefined,
		utmCampaign: local.utmCampaign ?? undefined,
		folderId: local.folderId ?? undefined,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toTag(local: LocalTag): Tag {
	return {
		id: local.id,
		name: local.name,
		slug: local.slug,
		color: local.color ?? undefined,
		icon: local.icon ?? undefined,
		visibility: local.visibility ?? 'space',
		usageCount: local.usageCount,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toFolder(local: LocalFolder): Folder {
	return {
		id: local.id,
		name: local.name,
		color: local.color ?? undefined,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toLinkTag(local: LocalLinkTag): LinkTag {
	return {
		id: local.id,
		linkId: local.linkId,
		tagId: local.tagId,
	};
}

// ─── Raw Observable Queries ───────────────────────────────

export function allLinks$() {
	return liveQuery(async () => {
		const locals = await scopedForModule<LocalLink, string>('uload', 'links').toArray();
		const visible = locals.filter((l) => !l.deletedAt);
		const decrypted = await decryptRecords('links', visible);
		return decrypted.map(toLink);
	});
}

export function allTags$() {
	return liveQuery(async () => {
		const locals = await scopedForModule<LocalTag, string>('uload', 'uloadTags').toArray();
		return locals.filter((t) => !t.deletedAt).map(toTag);
	});
}

export function allFolders$() {
	return liveQuery(async () => {
		const locals = await scopedForModule<LocalFolder, string>('uload', 'uloadFolders').toArray();
		return locals.filter((f) => !f.deletedAt).map(toFolder);
	});
}

export function allLinkTags$() {
	return liveQuery(async () => {
		const locals = await scopedForModule<LocalLinkTag, string>('uload', 'linkTags').toArray();
		return locals.filter((lt) => !lt.deletedAt).map(toLinkTag);
	});
}

// ─── Svelte 5 Reactive Hooks ──────────────────────────────

export function useAllLinks() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalLink, string>('uload', 'links').toArray();
		const visible = locals.filter((l) => !l.deletedAt);
		const decrypted = await decryptRecords('links', visible);
		return decrypted.map(toLink);
	}, [] as Link[]);
}

export function useAllTags() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalTag, string>('uload', 'uloadTags').toArray();
		return locals.filter((t) => !t.deletedAt).map(toTag);
	}, [] as Tag[]);
}

export function useAllFolders() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalFolder, string>('uload', 'uloadFolders').sortBy(
			'order'
		);
		return locals.filter((f) => !f.deletedAt).map(toFolder);
	}, [] as Folder[]);
}

export function useAllLinkTags() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalLinkTag, string>('uload', 'linkTags').toArray();
		return locals.filter((lt) => !lt.deletedAt).map(toLinkTag);
	}, [] as LinkTag[]);
}

export function useLinkById(id: string) {
	return useScopedLiveQuery(
		async () => {
			if (!id) return null;
			const local = await db.table<LocalLink>('links').get(id);
			if (!local || local.deletedAt) return null;
			const decrypted = await decryptRecord('links', { ...local });
			return toLink(decrypted);
		},
		null as Link | null
	);
}

// ─── Pure Filter / Sort Helpers ───────────────────────────

export function getFilteredLinks(links: Link[], filters: LinkFilterCriteria): Link[] {
	let result = links;

	if (filters.search) {
		const q = filters.search.toLowerCase();
		result = result.filter(
			(l) =>
				l.title?.toLowerCase().includes(q) ||
				l.originalUrl.toLowerCase().includes(q) ||
				l.shortCode.toLowerCase().includes(q)
		);
	}
	if (filters.status === 'active') result = result.filter((l) => l.isActive);
	if (filters.status === 'inactive') result = result.filter((l) => !l.isActive);
	if (filters.folderId) result = result.filter((l) => l.folderId === filters.folderId);

	return result;
}

export function getSortedLinks(links: Link[]): Link[] {
	return [...links].sort((a, b) => a.order - b.order);
}

export function getLinkById(links: Link[], id: string): Link | undefined {
	return links.find((l) => l.id === id);
}

export function getTagById(tags: Tag[], id: string): Tag | undefined {
	return tags.find((t) => t.id === id);
}

export function getFolderById(folders: Folder[], id: string): Folder | undefined {
	return folders.find((f) => f.id === id);
}

export function getTagUsageCount(linkTags: LinkTag[], tagId: string): number {
	return linkTags.filter((lt) => lt.tagId === tagId).length;
}

export function getLinkTags(linkTags: LinkTag[], tags: Tag[], linkId: string): Tag[] {
	const tagIds = linkTags.filter((lt) => lt.linkId === linkId).map((lt) => lt.tagId);
	return tags.filter((t) => tagIds.includes(t.id));
}

export function generateShortCode(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let code = '';
	for (let i = 0; i < 6; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
