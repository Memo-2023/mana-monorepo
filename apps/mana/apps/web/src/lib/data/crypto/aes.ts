/**
 * AES-GCM-256 wrap/unwrap primitives — thin re-export from `@mana/shared-crypto`.
 *
 * The implementation moved to the shared package on 2026-04-22 as part of
 * M1.5 of the MCP/Personas plan — mana-mcp tool handlers need byte-for-byte
 * identical wire format, so both the web app and server-side consumers
 * import from the same source.
 *
 * All prior importers in this app keep working against `$lib/data/crypto/aes`
 * — the module surface is unchanged.
 */

export {
	ENC_PREFIX,
	ENCRYPTION_VERSION,
	exportMasterKey,
	generateMasterKey,
	importMasterKey,
	isEncrypted,
	unwrapValue,
	wrapValue,
} from '@mana/shared-crypto';
