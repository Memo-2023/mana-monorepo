/**
 * Broadcast module — barrel exports.
 */

export { campaignTable, templateTable, settingsTable, BROADCAST_GUEST_SEED } from './collections';

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
