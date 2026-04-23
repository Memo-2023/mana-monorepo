/**
 * Tiny resolver mediaId → mana-media URL. Each module that renders
 * mana-media files keeps its own — consolidating into a shared helper
 * is a future-optimization, not an M2 task. Mirrors the inline pattern
 * in wallpaper and invoices/pdf/logo.
 */

import { browser } from '$app/environment';

function mediaBaseUrl(): string {
	if (browser) {
		const injected = (window as unknown as { __PUBLIC_MANA_MEDIA_URL__?: string })
			.__PUBLIC_MANA_MEDIA_URL__;
		if (injected) return injected;
	}
	return import.meta.env.PUBLIC_MANA_MEDIA_URL ?? 'http://localhost:3015';
}

export function garmentPhotoUrl(
	mediaId: string,
	variant: 'original' | 'large' | 'medium' | 'thumb' = 'medium'
): string {
	const base = mediaBaseUrl();
	if (variant === 'original') return `${base}/api/v1/media/${mediaId}/file`;
	return `${base}/api/v1/media/${mediaId}/file/${variant}`;
}
