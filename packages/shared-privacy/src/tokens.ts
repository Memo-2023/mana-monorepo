/**
 * Generate a URL-safe 32-character share token for unlisted-mode
 * records. Randomness comes from `crypto.getRandomValues` (CSPRNG on
 * every target Mana runs on: modern browsers, Bun, Node ≥18).
 *
 * 24 random bytes encode to exactly 32 base64url characters, so we get
 * ~192 bits of entropy — far more than enough to resist enumeration
 * attacks on an unlisted-link endpoint.
 *
 * Token rotation is NOT automatic. To revoke a share: unset the token
 * column and flip visibility back to 'private'. Regenerating is a
 * deliberate user action (e.g. "neu generieren" button in the share
 * dialog).
 */
export function generateUnlistedToken(): string {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return base64urlEncode(bytes);
}

function base64urlEncode(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
