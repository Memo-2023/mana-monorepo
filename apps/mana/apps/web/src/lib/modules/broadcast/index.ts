/**
 * Broadcast module — barrel exports.
 */

export { campaignTable, templateTable, settingsTable, BROADCAST_GUEST_SEED } from './collections';

export {
	useAllCampaigns,
	useAllTemplates,
	toCampaign,
	toTemplate,
	toSettings,
	filterByStatus,
	searchCampaigns,
	computeStats,
	formatRate,
} from './queries';

export {
	matchContact,
	filterAudience,
	countAudience,
	describeAudience,
} from './audience/segment-builder';

export { broadcastCampaignsStore } from './stores/campaigns.svelte';
export { broadcastSettingsStore, ensureSettings } from './stores/settings.svelte';

export { renderEmailHtml } from './render/email-html';
export { renderPlainText } from './render/plain-text';

export {
	STATUS_LABELS,
	STATUS_COLORS,
	BROADCAST_SETTINGS_ID,
	MAX_RECIPIENTS_PER_CAMPAIGN,
	MAX_RECIPIENTS_PER_HOUR,
} from './constants';

export type {
	LocalCampaign,
	LocalBroadcastTemplate,
	LocalBroadcastSettings,
	Campaign,
	BroadcastTemplate,
	BroadcastSettings,
	CampaignStatus,
	CampaignContent,
	CampaignStats,
	AudienceDefinition,
	AudienceFilter,
	AudienceField,
	AudienceOp,
	DnsCheck,
	DnsRecordStatus,
} from './types';
