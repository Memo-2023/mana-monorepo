import { createLocalStore, type LocalCollection } from '@manacore/local-store';
import type { UloadLink, CreateShortLinkOptions, CreatedLink } from './types';
import { generateShortCode, getShortUrl, getQrCodeUrl } from './utils';

let _linkCollection: LocalCollection<UloadLink> | null = null;
let _store: ReturnType<typeof createLocalStore> | null = null;
let _baseUrl: string | undefined;
let _initPromise: Promise<void> | null = null;

/**
 * Initialize the shared uLoad utility.
 *
 * Option A: Pass an existing linkCollection (from inside uLoad's own app).
 * Option B: Call with no collection — it opens the uLoad IndexedDB directly (from any other app).
 */
export function initSharedUload(
	linkCollectionOrOptions?: LocalCollection<UloadLink> | { baseUrl?: string },
	options?: { baseUrl?: string }
): void {
	if (linkCollectionOrOptions && 'insert' in linkCollectionOrOptions) {
		// Option A: Existing collection
		_linkCollection = linkCollectionOrOptions;
		_baseUrl = options?.baseUrl;
	} else {
		// Option B: Self-initialize by opening the uLoad database
		const opts = linkCollectionOrOptions as { baseUrl?: string } | undefined;
		_baseUrl = opts?.baseUrl;

		_store = createLocalStore({
			appId: 'uload',
			collections: [
				{
					name: 'links',
					indexes: [
						'shortCode',
						'isActive',
						'folderId',
						'order',
						'clickCount',
						'source',
						'[folderId+order]',
						'[isActive+order]',
					],
				},
			],
		});

		_initPromise = _store.initialize().then(() => {
			_linkCollection = _store!.collection<UloadLink>('links');
		});
	}
}

async function ensureReady(): Promise<LocalCollection<UloadLink>> {
	if (_initPromise) {
		await _initPromise;
	}
	if (!_linkCollection) {
		throw new Error(
			'@manacore/shared-uload not initialized. Call initSharedUload() in your app layout.'
		);
	}
	return _linkCollection;
}

/**
 * Create a short link from any app.
 * The link is inserted into the uLoad local-store and syncs automatically.
 */
export async function createShortLink(options: CreateShortLinkOptions): Promise<CreatedLink> {
	const collection = await ensureReady();

	const shortCode = options.customCode || generateShortCode();
	const id = crypto.randomUUID();
	const shortUrl = getShortUrl(shortCode, _baseUrl);
	const qrCodeUrl = getQrCodeUrl(shortUrl);

	await collection.insert({
		id,
		shortCode,
		customCode: options.customCode || null,
		originalUrl: options.url,
		title: options.title || null,
		description: options.description || null,
		isActive: true,
		clickCount: 0,
		folderId: null,
		order: 0,
		source: options.source,
		expiresAt: options.expiresAt || null,
		password: options.password || null,
		qrCodeUrl,
	} as UloadLink);

	return { id, shortCode, shortUrl, qrCodeUrl };
}

/**
 * Check if shared-uload has been initialized.
 */
export function isSharedUloadReady(): boolean {
	return _linkCollection !== null || _initPromise !== null;
}

export function getBaseUrl(): string | undefined {
	return _baseUrl;
}
