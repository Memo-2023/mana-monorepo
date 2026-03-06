/**
 * Resolve Matrix mxc:// URLs to HTTPS URLs for display.
 * mxc://server/mediaId → https://server/_matrix/media/v3/download/server/mediaId
 */
export function resolveMxcUrl(mxcUrl: string, homeserverUrl: string): string | null {
	if (!mxcUrl?.startsWith('mxc://')) return null;

	const withoutProtocol = mxcUrl.slice('mxc://'.length);
	const slashIndex = withoutProtocol.indexOf('/');
	if (slashIndex === -1) return null;

	const server = withoutProtocol.slice(0, slashIndex);
	const mediaId = withoutProtocol.slice(slashIndex + 1);

	// Use the homeserver as proxy (handles auth and federation)
	const base = homeserverUrl.replace(/\/$/, '');
	return `${base}/_matrix/media/v3/download/${server}/${mediaId}`;
}

/**
 * Resolve mxc:// to a thumbnail URL via the homeserver.
 */
export function resolveMxcThumbnail(
	mxcUrl: string,
	homeserverUrl: string,
	width = 96,
	height = 96,
	method: 'crop' | 'scale' = 'crop',
): string | null {
	if (!mxcUrl?.startsWith('mxc://')) return null;

	const withoutProtocol = mxcUrl.slice('mxc://'.length);
	const slashIndex = withoutProtocol.indexOf('/');
	if (slashIndex === -1) return null;

	const server = withoutProtocol.slice(0, slashIndex);
	const mediaId = withoutProtocol.slice(slashIndex + 1);

	const base = homeserverUrl.replace(/\/$/, '');
	return `${base}/_matrix/media/v3/thumbnail/${server}/${mediaId}?width=${width}&height=${height}&method=${method}`;
}
