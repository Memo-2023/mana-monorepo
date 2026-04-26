<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { PRESET_LABELS, THEME_PRESETS, type ThemePreset } from '@mana/website-blocks/themes';
	import { sitesStore } from '../stores/sites.svelte';
	import DomainsSection from './DomainsSection.svelte';
	import type { Website, ThemeConfig } from '../types';

	interface Props {
		site: Website;
		onClose: () => void;
	}

	let { site, onClose }: Props = $props();

	// Working copy — committed on save so escape/close discards unsaved
	// edits. The initial-value-only warnings are intentional here: this
	// dialog is a snapshot-based form; it does not track further changes
	// to `site` while open.
	/* svelte-ignore state_referenced_locally */
	let draftPreset = $state<ThemePreset>((site.theme?.preset ?? 'classic') as ThemePreset);
	/* svelte-ignore state_referenced_locally */
	let draftPrimary = $state(site.theme?.overrides?.primary ?? '');
	/* svelte-ignore state_referenced_locally */
	let draftBackground = $state(site.theme?.overrides?.background ?? '');
	/* svelte-ignore state_referenced_locally */
	let draftForeground = $state(site.theme?.overrides?.foreground ?? '');
	/* svelte-ignore state_referenced_locally */
	let draftFooterText = $state(site.footerConfig?.text ?? '');
	let saving = $state(false);

	const presets = Object.keys(PRESET_LABELS) as ThemePreset[];
	const previewTokens = $derived(THEME_PRESETS[draftPreset]);

	async function save() {
		saving = true;
		try {
			const overrides: ThemeConfig['overrides'] = {};
			if (draftPrimary) overrides.primary = draftPrimary;
			if (draftBackground) overrides.background = draftBackground;
			if (draftForeground) overrides.foreground = draftForeground;

			const theme: ThemeConfig = {
				preset: draftPreset,
				...(Object.keys(overrides).length > 0 ? { overrides } : {}),
			};

			await sitesStore.updateSite(site.id, {
				theme,
				footerConfig: {
					...site.footerConfig,
					text: draftFooterText,
				},
			});
			onClose();
		} finally {
			saving = false;
		}
	}

	function resetOverrides() {
		draftPrimary = '';
		draftBackground = '';
		draftForeground = '';
	}
</script>

<div
	class="wb-modal__backdrop"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="button"
	tabindex="-1"
	aria-label={$_('website.site_settings.close_aria')}
></div>

<div class="wb-modal" role="dialog" aria-modal="true" aria-labelledby="wb-settings-title">
	<header class="wb-modal__head">
		<h3 id="wb-settings-title">{$_('website.site_settings.heading')}</h3>
		<button
			class="wb-modal__close"
			onclick={onClose}
			aria-label={$_('website.site_settings.close_aria')}>×</button
		>
	</header>

	<div class="wb-modal__body">
		<section class="wb-section">
			<h4>{$_('website.site_settings.section_theme')}</h4>
			<div class="wb-presets">
				{#each presets as preset (preset)}
					{@const tokens = THEME_PRESETS[preset]}
					<button
						class="wb-preset"
						class:wb-preset--active={draftPreset === preset}
						onclick={() => (draftPreset = preset)}
					>
						<div
							class="wb-preset__swatch"
							style="background:{tokens.background};border-color:{tokens.border};"
						>
							<span class="wb-preset__dot" style="background:{tokens.primary};"></span>
							<span class="wb-preset__text" style="color:{tokens.foreground};">Aa</span>
						</div>
						<span class="wb-preset__label">{PRESET_LABELS[preset]}</span>
					</button>
				{/each}
			</div>
		</section>

		<section class="wb-section">
			<div class="wb-section__head">
				<h4>{$_('website.site_settings.section_overrides')}</h4>
				<button class="wb-btn wb-btn--ghost wb-btn--sm" onclick={resetOverrides}>
					{$_('website.site_settings.action_reset_overrides')}
				</button>
			</div>
			<div class="wb-colors">
				<label class="wb-color">
					<span>{$_('website.site_settings.label_primary')}</span>
					<input
						type="color"
						value={draftPrimary || previewTokens.primary}
						oninput={(e) => (draftPrimary = e.currentTarget.value)}
					/>
					<input
						type="text"
						value={draftPrimary}
						oninput={(e) => (draftPrimary = e.currentTarget.value)}
						placeholder={previewTokens.primary}
					/>
				</label>
				<label class="wb-color">
					<span>{$_('website.site_settings.label_background')}</span>
					<input
						type="color"
						value={draftBackground || previewTokens.background}
						oninput={(e) => (draftBackground = e.currentTarget.value)}
					/>
					<input
						type="text"
						value={draftBackground}
						oninput={(e) => (draftBackground = e.currentTarget.value)}
						placeholder={previewTokens.background}
					/>
				</label>
				<label class="wb-color">
					<span>{$_('website.site_settings.label_foreground')}</span>
					<input
						type="color"
						value={draftForeground || previewTokens.foreground}
						oninput={(e) => (draftForeground = e.currentTarget.value)}
					/>
					<input
						type="text"
						value={draftForeground}
						oninput={(e) => (draftForeground = e.currentTarget.value)}
						placeholder={previewTokens.foreground}
					/>
				</label>
			</div>
		</section>

		<section class="wb-section">
			<h4>{$_('website.site_settings.section_footer')}</h4>
			<label class="wb-field">
				<span>{$_('website.site_settings.label_footer_text')}</span>
				<input
					type="text"
					value={draftFooterText}
					oninput={(e) => (draftFooterText = e.currentTarget.value)}
					placeholder={$_('website.site_settings.placeholder_footer_text')}
				/>
			</label>
		</section>

		<section class="wb-section">
			<DomainsSection siteId={site.id} />
		</section>
	</div>

	<footer class="wb-modal__foot">
		<button class="wb-btn wb-btn--ghost" onclick={onClose} disabled={saving}
			>{$_('website.site_settings.action_cancel')}</button
		>
		<button class="wb-btn wb-btn--primary" onclick={save} disabled={saving}>
			{saving ? $_('website.site_settings.action_saving') : $_('website.site_settings.action_save')}
		</button>
	</footer>
</div>

<style>
	.wb-modal__backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 40;
		border: none;
	}
	.wb-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(92vw, 36rem);
		max-height: 85vh;
		background: rgb(15, 18, 24);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.wb-modal__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}
	.wb-modal__head h3 {
		margin: 0;
		font-size: 1rem;
	}
	.wb-modal__close {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: inherit;
		padding: 0.1rem 0.5rem;
		font-size: 1.1rem;
		border-radius: 0.375rem;
		cursor: pointer;
	}
	.wb-modal__body {
		padding: 1.25rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.wb-modal__foot {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}
	.wb-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.wb-section__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.wb-section h4 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.wb-presets {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}
	.wb-preset {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: transparent;
		border: 2px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		cursor: pointer;
		color: inherit;
	}
	.wb-preset--active {
		border-color: rgba(99, 102, 241, 0.9);
	}
	.wb-preset__swatch {
		width: 100%;
		aspect-ratio: 2;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
	}
	.wb-preset__dot {
		width: 0.875rem;
		height: 0.875rem;
		border-radius: 50%;
	}
	.wb-preset__text {
		font-weight: 600;
		font-size: 0.9rem;
	}
	.wb-preset__label {
		font-size: 0.75rem;
		opacity: 0.8;
	}
	.wb-colors {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-color {
		display: grid;
		grid-template-columns: 5rem 2.25rem 1fr;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.8125rem;
	}
	.wb-color input[type='color'] {
		width: 2.25rem;
		height: 2.25rem;
		padding: 0.15rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: transparent;
		cursor: pointer;
	}
	.wb-color input[type='text'],
	.wb-field input {
		padding: 0.4rem 0.55rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-size: 0.8125rem;
	}
	.wb-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-field > span {
		font-size: 0.75rem;
		opacity: 0.7;
	}
	.wb-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.wb-btn--sm {
		padding: 0.25rem 0.6rem;
		font-size: 0.75rem;
	}
	.wb-btn--ghost {
		background: transparent;
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.9);
		color: white;
	}
	.wb-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
