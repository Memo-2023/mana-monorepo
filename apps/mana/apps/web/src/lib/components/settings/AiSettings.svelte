<script lang="ts">
	/**
	 * AiSettings — Settings-page section for the tiered LLM orchestrator.
	 *
	 * Lets the user pick which @mana/shared-llm tiers Mana is allowed to
	 * use. Each tier is a selectable row with an explanation of what it
	 * means for privacy + speed + cost. The cloud tier is gated behind
	 * an additional consent step the first time it's enabled.
	 */
	import { llmSettingsState, updateLlmSettings, tierLabel, type LlmTier } from '@mana/shared-llm';
	import {
		isLocalLlmSupported,
		getLocalLlmStatus,
		loadLocalLlm,
		MODELS,
		DEFAULT_MODEL,
	} from '@mana/local-llm';
	import { Robot, Cpu, HardDrive, Cloud, Warning, CheckCircle, Key } from '@mana/shared-icons';
	import ByokKeysManager from './ByokKeysManager.svelte';

	const settings = $derived(llmSettingsState.current);
	const webgpuSupported = isLocalLlmSupported();
	const localLlmStatus = getLocalLlmStatus();
	const defaultModelInfo = MODELS[DEFAULT_MODEL];

	let loadingBrowser = $state(false);

	function toggleTier(tier: LlmTier) {
		if (tier === 'none') return;
		const current = settings.allowedTiers;
		const next = current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier];
		updateLlmSettings({ allowedTiers: next });
	}

	async function loadBrowserModel() {
		loadingBrowser = true;
		try {
			await loadLocalLlm();
		} finally {
			loadingBrowser = false;
		}
	}

	function setCloudConsent(value: boolean) {
		updateLlmSettings({ cloudConsentGiven: value });
	}

	function setFallback(value: boolean) {
		updateLlmSettings({ fallbackToRulesOnError: value });
	}

	function setShowSource(value: boolean) {
		updateLlmSettings({ showSourceInUi: value });
	}

	type TierCard = {
		tier: LlmTier;
		icon: typeof Robot;
		title: string;
		subtitle: string;
		bullets: string[];
		warning?: string;
	};

	const tierCards: TierCard[] = [
		{
			tier: 'browser',
			icon: Cpu,
			title: 'Auf deinem Gerät',
			subtitle: 'Gemma 4 E2B (Google) im Browser',
			bullets: [
				'100% lokal — Daten verlassen dein Gerät nicht',
				'~500 MB einmaliger Download',
				'Braucht WebGPU + 2 GB freien GPU-Speicher',
			],
		},
		{
			tier: 'mana-server',
			icon: HardDrive,
			title: 'Mana-Server',
			subtitle: 'Selbst-gehostet auf unserem Mac Mini',
			bullets: [
				'Schneller und stärker als Browser-LLM',
				'Daten laufen verschlüsselt zu unserem Server',
				'Keine Inhalte werden gespeichert',
			],
		},
		{
			tier: 'byok',
			icon: Key,
			title: 'Eigener API-Key',
			subtitle: 'OpenAI, Anthropic, Google Gemini oder Mistral',
			bullets: [
				'Direkt aus dem Browser — keine Mana-Server-Zwischenstation',
				'Du zahlst beim Provider, wir sehen nichts davon',
				'Schlüssel werden verschlüsselt in deinem Vault gespeichert',
			],
		},
		{
			tier: 'cloud',
			icon: Cloud,
			title: 'Google Gemini',
			subtitle: 'Cloud-API über unseren Server-Proxy',
			bullets: [
				'Stärkste Qualität für komplexe Aufgaben',
				'Schnellste Antworten',
				'Daten werden von Google verarbeitet',
			],
			warning: 'Nur empfehlenswert für nicht-sensitive Inhalte',
		},
	];

	function isEnabled(tier: LlmTier): boolean {
		return settings.allowedTiers.includes(tier);
	}

	const browserCacheReady = $derived(webgpuSupported && localLlmStatus.current.state === 'ready');
</script>

<div class="ai-settings">
	<!-- Tier 0 — always on -->
	<div class="tier-row tier0 enabled" aria-disabled="true">
		<div class="tier-icon">
			<CheckCircle size={20} weight="fill" />
		</div>
		<div class="tier-body">
			<div class="tier-title-line">
				<span class="tier-title">Lokal (ohne KI)</span>
				<span class="tier-badge tier-badge-always">immer aktiv</span>
			</div>
			<p class="tier-subtitle">Basis-Funktionen ohne jede KI</p>
			<p class="tier0-desc">
				Mana funktioniert auch ganz ohne KI: Datum-Erkennung, Suche und einfache Klassifikation
				laufen über klassische Algorithmen. Manche Funktionen sind dann begrenzt, dafür ist alles
				100% offline und kostet nichts.
			</p>
		</div>
	</div>

	<!-- Tier 1–3 selectable rows -->
	<div class="tier-list">
		{#each tierCards as card}
			{@const enabled = isEnabled(card.tier)}
			{@const tierBlocked = card.tier === 'browser' && !webgpuSupported}
			<button
				type="button"
				onclick={() => !tierBlocked && toggleTier(card.tier)}
				disabled={tierBlocked}
				class="tier-row"
				class:enabled
				class:blocked={tierBlocked}
			>
				<div class="tier-icon">
					<card.icon size={20} />
				</div>
				<div class="tier-body">
					<div class="tier-title-line">
						<span class="tier-title">{card.title}</span>
						{#if enabled}
							<span class="tier-badge">aktiv</span>
						{/if}
					</div>
					<p class="tier-subtitle">{card.subtitle}</p>
					<ul class="tier-bullets">
						{#each card.bullets as bullet}
							<li>{bullet}</li>
						{/each}
					</ul>
					{#if card.warning}
						<p class="tier-warning">
							<Warning size={12} weight="fill" />
							<span>{card.warning}</span>
						</p>
					{/if}

					{#if card.tier === 'browser' && enabled && webgpuSupported}
						<div class="tier-extra">
							{#if browserCacheReady}
								<span class="status-ok">✓ Modell geladen</span>
							{:else if localLlmStatus.current.state === 'downloading'}
								<span class="status-muted">
									Lade {defaultModelInfo.displayName} ({(
										localLlmStatus.current.progress * 100
									).toFixed(0)}%)…
								</span>
							{:else}
								<!-- svelte-ignore node_invalid_placement_ssr -->
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										loadBrowserModel();
									}}
									disabled={loadingBrowser}
									class="action-btn"
								>
									{loadingBrowser
										? 'Lade…'
										: `Modell laden (~${defaultModelInfo.downloadSizeMb} MB)`}
								</button>
							{/if}
						</div>
					{/if}

					{#if card.tier === 'browser' && tierBlocked}
						<p class="tier-blocked-note">
							WebGPU nicht verfügbar in deinem Browser. Funktioniert in Chrome/Edge 113+ oder Safari
							18+.
						</p>
					{/if}

					{#if card.tier === 'byok' && enabled}
						<div
							class="tier-extra"
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => e.stopPropagation()}
							role="presentation"
						>
							<ByokKeysManager />
						</div>
					{/if}

					{#if card.tier === 'cloud' && enabled && !settings.cloudConsentGiven}
						<div
							class="tier-consent"
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => e.stopPropagation()}
							role="presentation"
						>
							<p class="consent-title">Bestätigung erforderlich</p>
							<p class="consent-desc">
								Cloud-Anfragen senden deine Inhalte an Google. Bitte bestätige, dass du das
								verstanden hast und akzeptierst.
							</p>
							<!-- svelte-ignore node_invalid_placement_ssr -->
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									setCloudConsent(true);
								}}
								class="consent-btn"
							>
								Verstanden, Cloud aktivieren
							</button>
						</div>
					{/if}

					{#if card.tier === 'cloud' && enabled && settings.cloudConsentGiven}
						<div
							class="tier-extra consent-ok"
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => e.stopPropagation()}
							role="presentation"
						>
							<span class="status-ok">✓ Cloud-Zustimmung erteilt</span>
							<!-- svelte-ignore node_invalid_placement_ssr -->
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									setCloudConsent(false);
								}}
								class="link-btn"
							>
								Zurücknehmen
							</button>
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<!-- Active tier chain summary -->
	<div class="summary-row">
		<span class="summary-label">Aktuelle Reihenfolge:</span>
		<span class="summary-value">
			{#if settings.allowedTiers.length === 0}
				Nur lokal (ohne KI) — die meisten KI-Funktionen sind begrenzt.
			{:else}
				{settings.allowedTiers.map((t) => tierLabel(t)).join(' → ')} → Lokal (Fallback)
			{/if}
		</span>
	</div>

	<!-- Behavior toggles -->
	<div class="rows">
		<div class="row">
			<div class="row-info">
				<p class="row-title">Bei Fehler auf „Lokal" zurückfallen</p>
				<p class="row-desc">
					Wenn die gewählte KI-Schicht eine Anfrage nicht beantworten kann, versucht Mana es mit der
					lokalen Variante (sofern verfügbar). Aus: zeigt stattdessen einen Fehler an.
				</p>
			</div>
			<button
				type="button"
				class="toggle"
				class:on={settings.fallbackToRulesOnError}
				onclick={() => setFallback(!settings.fallbackToRulesOnError)}
				aria-label="Fallback auf Lokal"
			>
				<span class="toggle-knob"></span>
			</button>
		</div>

		<div class="row">
			<div class="row-info">
				<p class="row-title">Quelle bei jedem KI-Resultat anzeigen</p>
				<p class="row-desc">
					Zeigt unter jeder KI-generierten Antwort eine kleine Markierung wie „Auf deinem Gerät"
					oder „via Google Gemini" — damit du immer siehst, wo deine Daten gerade verarbeitet
					wurden.
				</p>
			</div>
			<button
				type="button"
				class="toggle"
				class:on={settings.showSourceInUi}
				onclick={() => setShowSource(!settings.showSourceInUi)}
				aria-label="Quelle anzeigen"
			>
				<span class="toggle-knob"></span>
			</button>
		</div>
	</div>
</div>

<style>
	.ai-settings {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* ── Tier 0 — always-active (same card shape, non-interactive) ───── */
	.tier-row.tier0 {
		cursor: default;
		border-color: hsl(142 71% 45% / 0.35);
		background: hsl(142 71% 45% / 0.05);
		box-shadow: inset 0 0 0 1px hsl(142 71% 45% / 0.1);
	}
	.tier-row.tier0:hover {
		border-color: hsl(142 71% 45% / 0.35);
		background: hsl(142 71% 45% / 0.05);
	}
	.tier-row.tier0 .tier-icon {
		background: hsl(142 71% 45% / 0.15);
		color: hsl(142 71% 45%);
	}
	.tier-row.tier0 .tier-badge-always {
		background: hsl(142 71% 45%);
		color: white;
	}
	.tier0-desc {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.6;
	}

	/* ── Tier selection list ────────────────────────────────────────── */
	.tier-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tier-row {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.875rem;
		text-align: left;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.tier-row:not(.blocked):hover {
		border-color: hsl(var(--color-border-strong, var(--color-border)));
		background: hsl(var(--color-surface-hover, var(--color-muted)) / 0.4);
	}
	.tier-row.enabled {
		border-color: hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.04);
		box-shadow: inset 0 0 0 1px hsl(var(--color-primary) / 0.15);
	}
	.tier-row.blocked {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tier-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.625rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		transition:
			background 0.15s,
			color 0.15s;
	}
	.tier-row.enabled .tier-icon {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	.tier-body {
		min-width: 0;
		flex: 1;
	}

	.tier-title-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tier-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.tier-badge {
		padding: 0.0625rem 0.4375rem;
		font-size: 0.625rem;
		font-weight: 500;
		border-radius: 9999px;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.tier-subtitle {
		margin: 0.1875rem 0 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
	}

	.tier-bullets {
		margin: 0.625rem 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.3125rem;
	}

	.tier-bullets li {
		position: relative;
		padding-left: 0.9375rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground) / 0.78);
		line-height: 1.55;
	}

	.tier-bullets li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: hsl(var(--color-primary));
	}

	.tier-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		margin: 0.625rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: hsl(35 90% 45%);
	}
	.tier-warning :global(svg) {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.tier-extra {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.625rem;
		font-size: 0.75rem;
	}
	.tier-extra.consent-ok {
		justify-content: space-between;
	}

	.status-ok {
		color: hsl(142 71% 45%);
	}
	.status-muted {
		color: hsl(var(--color-muted-foreground));
	}

	.tier-blocked-note {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: hsl(35 90% 45%);
	}

	.action-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		cursor: pointer;
	}
	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.link-btn {
		padding: 0;
		border: none;
		background: transparent;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.link-btn:hover {
		color: hsl(var(--color-foreground));
	}

	/* ── Cloud consent inline block ─────────────────────────────────── */
	.tier-consent {
		margin-top: 0.625rem;
		padding: 0.625rem 0.75rem;
		border-left: 3px solid hsl(35 90% 55%);
		background: hsl(35 90% 55% / 0.06);
		border-radius: 0 0.375rem 0.375rem 0;
	}
	.consent-title {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(35 90% 40%);
	}
	.consent-desc {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.55;
	}
	.consent-btn {
		margin-top: 0.5rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		border: none;
		border-radius: 0.5rem;
		background: hsl(35 90% 50%);
		color: white;
		cursor: pointer;
	}
	.consent-btn:hover {
		background: hsl(35 90% 45%);
	}

	/* ── Summary row ────────────────────────────────────────────────── */
	.summary-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: hsl(var(--color-muted-foreground));
	}
	.summary-label {
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.summary-value {
		min-width: 0;
	}

	/* ── Behavior toggle rows (matches GeneralSection) ──────────────── */
	.rows {
		display: flex;
		flex-direction: column;
		border-top: 1px solid hsl(var(--color-border));
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.row:last-child {
		border-bottom: none;
	}

	.row-info {
		min-width: 0;
		flex: 1;
	}

	.row-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.row-desc {
		margin: 0.1875rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.55;
	}

	.toggle {
		position: relative;
		width: 2.75rem;
		height: 1.5rem;
		border-radius: 9999px;
		border: none;
		cursor: pointer;
		transition: background 0.2s;
		background: hsl(var(--color-muted));
		flex-shrink: 0;
	}

	.toggle.on {
		background: hsl(var(--color-primary));
	}

	.toggle-knob {
		position: absolute;
		top: 0.125rem;
		left: 0.125rem;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: white;
		transition: transform 0.2s;
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.15);
	}

	.toggle.on .toggle-knob {
		transform: translateX(1.25rem);
	}
</style>
