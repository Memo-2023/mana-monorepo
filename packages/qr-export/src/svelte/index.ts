/**
 * Svelte components for ManaQR
 *
 * @example
 * ```svelte
 * <script>
 *   import { ManaQRCode, ManaQRScanner } from '@mana/qr-export/svelte';
 *   import { createManaQRExport } from '@mana/qr-export';
 *
 *   const exportData = createManaQRExport()
 *     .user({ n: 'Till' })
 *     .encode();
 *
 *   function handleScan(data) {
 *     console.log('Scanned:', data);
 *   }
 * </script>
 *
 * <ManaQRCode data={exportData} size={250} />
 * <ManaQRScanner onScan={handleScan} />
 * ```
 */

export { default as ManaQRCode } from './ManaQRCode.svelte';
export { default as ManaQRScanner } from './ManaQRScanner.svelte';

// Re-export types for convenience
export type {
	ManaQRExport,
	ManaQRUserContext,
	ManaQRContact,
	ManaQREvent,
	ManaQRTodo,
	EncodeResult,
	DecodeResult,
} from '../types';
