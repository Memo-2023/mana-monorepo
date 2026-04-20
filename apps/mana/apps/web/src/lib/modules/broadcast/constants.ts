import type { CampaignStatus } from './types';

export const STATUS_LABELS: Record<CampaignStatus, { de: string; en: string }> = {
	draft: { de: 'Entwurf', en: 'Draft' },
	scheduled: { de: 'Geplant', en: 'Scheduled' },
	sending: { de: 'Versand läuft', en: 'Sending' },
	sent: { de: 'Versendet', en: 'Sent' },
	cancelled: { de: 'Abgebrochen', en: 'Cancelled' },
};

export const STATUS_COLORS: Record<CampaignStatus, string> = {
	draft: '#64748b', // slate-500
	scheduled: '#6366f1', // indigo-500
	sending: '#f59e0b', // amber-500
	sent: '#22c55e', // green-500
	cancelled: '#94a3b8', // slate-400
};

/** Stable sentinel so the singleton settings row dedupes across devices. */
export const BROADCAST_SETTINGS_ID = 'broadcast-settings';

/** Conservative per-user cap until we talk to the SMTP provider. Mirrors
 *  the mana-mail env var BROADCAST_MAX_RECIPIENTS_PER_CAMPAIGN. */
export const MAX_RECIPIENTS_PER_CAMPAIGN = 5000;

/** Rate-limit hint for the UI — server-side limit is the authoritative one. */
export const MAX_RECIPIENTS_PER_HOUR = 500;
