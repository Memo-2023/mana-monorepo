/**
 * Custom-domain client — talks to apps/api's
 * /api/v1/website/sites/:id/domains endpoints.
 *
 * Founder-tier only on the server; the client doesn't gate, we just
 * surface server errors.
 */

import { getManaApiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';

export interface CustomDomain {
	id: string;
	siteId: string;
	hostname: string;
	status: 'pending' | 'verifying' | 'verified' | 'failed';
	dnsTarget: string;
	verificationToken: string;
	errorMessage: string | null;
	verifiedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export class DomainError extends Error {
	readonly code: string;
	readonly status: number;
	constructor(message: string, code: string, status: number) {
		super(message);
		this.name = 'DomainError';
		this.code = code;
		this.status = status;
	}
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
	const token = await authStore.getValidToken();
	if (!token) throw new DomainError('Nicht angemeldet', 'NO_TOKEN', 401);
	return fetch(`${getManaApiUrl()}${path}`, {
		...init,
		headers: {
			...(init?.headers ?? {}),
			Authorization: `Bearer ${token}`,
		},
	});
}

async function readJson<T>(res: Response, defaultMessage: string): Promise<T> {
	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as { code?: string; error?: string };
		throw new DomainError(body.error ?? defaultMessage, body.code ?? 'UNKNOWN', res.status);
	}
	return (await res.json()) as T;
}

export async function listDomains(siteId: string): Promise<CustomDomain[]> {
	const res = await authFetch(`/api/v1/website/sites/${siteId}/domains`);
	const body = await readJson<{ domains: CustomDomain[] }>(res, 'Konnte Domains nicht laden');
	return body.domains;
}

export async function addDomain(siteId: string, hostname: string): Promise<CustomDomain> {
	const res = await authFetch(`/api/v1/website/sites/${siteId}/domains`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ hostname }),
	});
	return readJson<CustomDomain>(res, 'Konnte Domain nicht hinzufügen');
}

export async function verifyDomain(
	siteId: string,
	domainId: string
): Promise<{ verified: boolean; reason?: string }> {
	const res = await authFetch(`/api/v1/website/sites/${siteId}/domains/${domainId}/verify`, {
		method: 'POST',
	});
	// 400 on failed verification is expected — caller displays the reason.
	if (res.status === 400) {
		const body = (await res.json().catch(() => ({}))) as { reason?: string };
		return { verified: false, reason: body.reason };
	}
	const body = await readJson<{ verified: boolean; reason?: string }>(res, 'Verify fehlgeschlagen');
	return body;
}

export async function removeDomain(siteId: string, domainId: string): Promise<void> {
	const res = await authFetch(`/api/v1/website/sites/${siteId}/domains/${domainId}`, {
		method: 'DELETE',
	});
	await readJson<{ deleted: boolean }>(res, 'Löschen fehlgeschlagen');
}
