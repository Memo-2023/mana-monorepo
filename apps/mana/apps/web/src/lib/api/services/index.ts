/**
 * API Services barrel.
 *
 * Per-app HTTP backend services (todo, calendar, contacts, chat, storage,
 * cards, music, picture, presi, zitare, clock, context) used to live here
 * but were removed in the pre-launch ghost-API cleanup — every product
 * module now reads/writes the unified Dexie database via the local-first
 * sync layer (`mana-sync`), and `qr-export` queries Dexie directly.
 *
 * What remains here is genuinely server-bound:
 *   - admin       → admin operations against mana-auth
 *   - landing     → org landing page editor (mana-landing-builder)
 *   - my-data     → user data summary / GDPR export against mana-auth
 *   - qr-export   → reads from local Dexie, builds the QR snapshot
 */

export { adminService, type UserListItem, type ProjectDataSummary } from './admin';
export { getOrganization, saveLandingConfig, publishLanding } from './landing';
export { myDataService, type UserDataSummary } from './my-data';
export { qrExportService, type QRExportData, type QRExportResult } from './qr-export';
