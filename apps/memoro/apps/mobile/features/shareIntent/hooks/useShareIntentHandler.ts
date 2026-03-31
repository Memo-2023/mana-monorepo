import { useEffect } from 'react';
import { useShareIntent } from 'expo-share-intent';
import { useShareIntentStore, ShareIntentFile } from '../store/shareIntentStore';

const SUPPORTED_EXTENSIONS = [
	'mp3',
	'm4a',
	'wav',
	'aac',
	'flac',
	'ogg',
	'wma',
	'opus',
	'mp4',
	'mov',
	'mkv',
	'avi',
	'wmv',
	'flv',
	'webm',
	'm4v',
	'3gp',
];

function getExtension(filename: string): string {
	return filename.split('.').pop()?.toLowerCase() || '';
}

/** Convert duration from share intent to milliseconds, handling ambiguous units */
function toDurationMs(duration: number | null | undefined): number | undefined {
	if (!duration || duration <= 0) return undefined;
	// If value > 100_000 it's likely already in ms (>27h in seconds is unrealistic for a shared file)
	if (duration > 100_000) return Math.floor(duration);
	return Math.floor(duration * 1000);
}

export function useShareIntentHandler(options?: { resetOnBackground?: boolean; debug?: boolean }) {
	const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent(options);
	const setPendingIntent = useShareIntentStore((s) => s.setPendingIntent);

	useEffect(() => {
		if (!hasShareIntent || !shareIntent) return;

		console.debug('[ShareIntent] Received intent:', shareIntent.type);

		if (shareIntent.type === 'file' || shareIntent.type === 'media') {
			const files: ShareIntentFile[] = (shareIntent.files || [])
				.filter((f: any) => {
					const ext = getExtension(f.fileName || f.path || '');
					return SUPPORTED_EXTENSIONS.includes(ext);
				})
				.map((f: any) => ({
					uri: f.path || f.uri,
					name: f.fileName || f.path?.split('/').pop() || 'shared_file',
					mimeType: f.mimeType,
					durationMs: toDurationMs(f.duration),
				}));

			if (files.length > 0) {
				setPendingIntent({
					type: 'file',
					files: files.slice(0, 5),
					receivedAt: Date.now(),
				});
			}
		} else if (shareIntent.type === 'text') {
			if (shareIntent.text) {
				setPendingIntent({
					type: 'text',
					text: shareIntent.text,
					receivedAt: Date.now(),
				});
			}
		} else if (shareIntent.type === 'weburl') {
			if (shareIntent.webUrl) {
				setPendingIntent({
					type: 'url',
					webUrl: shareIntent.webUrl || undefined,
					text: shareIntent.text || undefined,
					receivedAt: Date.now(),
				});
			}
		}

		resetShareIntent();
	}, [hasShareIntent, shareIntent, resetShareIntent, setPendingIntent]);
}
