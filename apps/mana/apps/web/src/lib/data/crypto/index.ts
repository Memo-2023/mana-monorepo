/**
 * Public surface of the data-layer encryption module.
 *
 * Phase 1 (this commit) ships the foundation only:
 *   - AES-GCM-256 wrap/unwrap primitives
 *   - KeyProvider interface with NullKeyProvider as the default
 *   - Strict allowlist registry of fields-to-encrypt (all `enabled: false`)
 *
 * No table is actually encrypted yet. Phase 2 wires up the mana-auth
 * server vault that mints + serves the per-user master key. Phase 3
 * flips the registry entries to `enabled: true` table by table and
 * teaches the Dexie hooks to call wrapValue/unwrapValue on the right
 * fields. Phase 4 polishes the UX (settings page, lock state UI).
 *
 * Importers should pull from this barrel rather than reaching into the
 * sub-files directly, so future internal refactors stay invisible.
 */

export {
	ENCRYPTION_VERSION,
	ENC_PREFIX,
	isEncrypted,
	wrapValue,
	unwrapValue,
	generateMasterKey,
	importMasterKey,
	exportMasterKey,
} from './aes';

export {
	type KeyProvider,
	MemoryKeyProvider,
	setKeyProvider,
	getKeyProvider,
	getActiveKey,
	isVaultUnlocked,
} from './key-provider';

export {
	type EncryptionConfig,
	ENCRYPTION_REGISTRY,
	getEncryptedFields,
	hasAnyEncryption,
	getRegisteredTables,
} from './registry';

export { encryptRecord, decryptRecord, decryptRecords, VaultLockedError } from './record-helpers';

export {
	RECOVERY_SECRET_BYTES,
	RecoveryCodeFormatError,
	generateRecoverySecret,
	formatRecoveryCode,
	parseRecoveryCode,
	deriveRecoveryWrapKey,
	wrapMasterKeyWithRecovery,
	unwrapMasterKeyWithRecovery,
} from './recovery';

export {
	type VaultClient,
	type VaultClientOptions,
	type VaultUnlockState,
	type VaultStatus,
	type RecoveryCodeSetupResult,
	createVaultClient,
} from './vault-client';

export { getVaultClient } from './vault-instance';
