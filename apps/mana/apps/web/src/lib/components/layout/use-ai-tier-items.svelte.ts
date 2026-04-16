/**
 * AI Tier Selector — composable for the PillNavigation AI dropdown.
 *
 * Manages LLM tier toggles (browser/server/cloud) and STT model
 * selection. Returns reactive PillDropdownItem arrays + labels.
 */

import { goto } from '$app/navigation';
import type { PillDropdownItem } from '@mana/shared-ui';
import { llmSettingsState, updateLlmSettings, type LlmTier } from '@mana/shared-llm';
import { isLocalLlmSupported, getLocalLlmStatus, loadLocalLlm } from '@mana/local-llm';
import {
	getLocalSttStatus,
	loadLocalStt,
	isLocalSttSupported,
	MODELS as STT_MODELS,
	DEFAULT_MODEL as STT_DEFAULT_MODEL,
	type ModelKey as SttModelKey,
} from '@mana/local-stt';

const TIER_TOGGLE_LIST: Array<{ tier: LlmTier; shortLabel: string; icon: string }> = [
	{ tier: 'browser', shortLabel: 'Lokal (Gemma 4)', icon: 'robot' },
	{ tier: 'mana-server', shortLabel: 'Server (Gemma 4)', icon: 'globe' },
	{ tier: 'cloud', shortLabel: 'Cloud (Gemini)', icon: 'cloud' },
];

export function useAiTierItems() {
	const webgpuSupported = isLocalLlmSupported();
	const localLlmStatus = getLocalLlmStatus();
	const sttSupported = isLocalSttSupported();
	const localSttStatus = getLocalSttStatus();
	let selectedSttModel = $state<SttModelKey>(STT_DEFAULT_MODEL);
	const llmSettings = $derived(llmSettingsState.current);

	function toggleAiTier(tier: LlmTier) {
		const current = llmSettings.allowedTiers;
		const next = current.includes(tier)
			? current.filter((t: LlmTier) => t !== tier)
			: [...current, tier];
		updateLlmSettings({ allowedTiers: next });
	}

	function buildLlmStatusItem(): PillDropdownItem {
		const s = localLlmStatus.current;
		const state = s.state;
		let label: string;
		let icon: string;
		let danger = false;
		let disabled = false;

		switch (state) {
			case 'ready':
				label = 'Geladen';
				icon = 'checkCircle';
				disabled = true;
				break;
			case 'downloading':
				label = `Lade… ${((s as { progress: number }).progress * 100).toFixed(0)}%`;
				icon = 'clock';
				disabled = true;
				break;
			case 'loading':
				label = 'Initialisiere…';
				icon = 'clock';
				disabled = true;
				break;
			case 'checking':
				label = 'Prüfe…';
				icon = 'clock';
				disabled = true;
				break;
			case 'error':
				label = 'Fehler — erneut versuchen';
				icon = 'bell';
				danger = true;
				break;
			default:
				label = 'Modell laden';
				icon = 'cloud';
		}

		return {
			id: 'ai-browser-status',
			label,
			icon,
			group: 'local-llm',
			danger,
			disabled,
			progress: state === 'downloading' ? (s as { progress: number }).progress : undefined,
			onClick: !disabled ? () => void loadLocalLlm() : undefined,
		};
	}

	function buildSttStatusItem(): PillDropdownItem {
		const s = localSttStatus.current;
		const state = s.state;
		let label: string;
		let icon: string;
		let danger = false;
		let disabled = false;

		switch (state) {
			case 'ready':
				label = 'STT bereit';
				icon = 'checkCircle';
				disabled = true;
				break;
			case 'downloading':
				label = `STT Lade… ${((s as { progress: number }).progress * 100).toFixed(0)}%`;
				icon = 'clock';
				disabled = true;
				break;
			case 'loading':
				label = 'STT lädt…';
				icon = 'clock';
				disabled = true;
				break;
			case 'checking':
				label = 'STT prüft…';
				icon = 'clock';
				disabled = true;
				break;
			case 'error':
				label = 'STT Fehler';
				icon = 'bell';
				danger = true;
				break;
			default:
				label = 'STT Modell laden';
				icon = 'mic';
		}

		return {
			id: 'stt-status',
			label,
			icon,
			danger,
			disabled,
			progress: state === 'downloading' ? (s as { progress: number }).progress : undefined,
			onClick: !disabled ? () => void loadLocalStt(selectedSttModel) : undefined,
		};
	}

	const items = $derived<PillDropdownItem[]>([
		// Tier toggles
		...TIER_TOGGLE_LIST.filter((t) => t.tier !== 'browser' || webgpuSupported).map((t) => {
			const isActive = llmSettings.allowedTiers.includes(t.tier);
			return {
				id: `ai-tier-${t.tier}`,
				label: t.shortLabel,
				icon: isActive ? 'checkCircle' : t.icon,
				active: isActive,
				onClick: () => toggleAiTier(t.tier),
				...(t.tier === 'browser' ? { group: 'local-llm' } : {}),
			};
		}),
		// Browser model status (grouped with the "Lokal" toggle)
		...(llmSettings.allowedTiers.includes('browser') && webgpuSupported
			? [buildLlmStatusItem()]
			: []),
		// STT section
		{ id: 'stt-divider', label: '', divider: true },
		...(sttSupported
			? (Object.entries(STT_MODELS) as [SttModelKey, (typeof STT_MODELS)[SttModelKey]][]).map(
					([key, model]) => {
						const isSelected = selectedSttModel === key;
						return {
							id: `stt-model-${key}`,
							label: model.displayName,
							icon: isSelected ? 'checkCircle' : 'mic',
							active: isSelected,
							onClick: () => {
								selectedSttModel = key;
								void loadLocalStt(key);
							},
						};
					}
				)
			: []),
		...(sttSupported ? [buildSttStatusItem()] : []),
		// Settings link
		{ id: 'ai-divider', label: '', divider: true },
		{
			id: 'ai-settings',
			label: 'KI-Einstellungen',
			icon: 'settings',
			onClick: () => goto('/?app=settings#ai-options'),
		},
	]);

	const label = $derived.by(() => {
		const active = llmSettings.allowedTiers;
		if (active.length === 0) return 'Aus';
		const sorted = [...active].sort(
			(a, b) =>
				TIER_TOGGLE_LIST.findIndex((t) => t.tier === a) -
				TIER_TOGGLE_LIST.findIndex((t) => t.tier === b)
		);
		const first = TIER_TOGGLE_LIST.find((t) => t.tier === sorted[0]);
		return first ? first.shortLabel.split(' (')[0] : 'KI';
	});

	const icon = $derived.by(() => {
		const active = llmSettings.allowedTiers;
		if (active.length === 0) return 'power';
		const sorted = [...active].sort(
			(a, b) =>
				TIER_TOGGLE_LIST.findIndex((t) => t.tier === a) -
				TIER_TOGGLE_LIST.findIndex((t) => t.tier === b)
		);
		const first = TIER_TOGGLE_LIST.find((t) => t.tier === sorted[0]);
		return first ? first.icon : 'cpu';
	});

	return {
		get items() {
			return items;
		},
		get label() {
			return label;
		},
		get icon() {
			return icon;
		},
	};
}
