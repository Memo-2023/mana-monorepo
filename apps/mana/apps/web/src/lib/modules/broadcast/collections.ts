/**
 * Broadcast module — Dexie accessors.
 *
 * No guest seed: shipping a demo campaign feels wrong for a module that
 * will eventually hit real SMTP. The empty state is the onboarding.
 */

import { db } from '$lib/data/database';
import type { LocalCampaign, LocalBroadcastTemplate, LocalBroadcastSettings } from './types';

export const campaignTable = db.table<LocalCampaign>('broadcastCampaigns');
export const templateTable = db.table<LocalBroadcastTemplate>('broadcastTemplates');
export const settingsTable = db.table<LocalBroadcastSettings>('broadcastSettings');

/** Explicitly empty so module-registry loaders still get a valid export. */
export const BROADCAST_GUEST_SEED = {};
