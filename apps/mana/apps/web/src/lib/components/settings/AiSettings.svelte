<script lang="ts">
	/**
	 * AiSettings — Settings-page section for the tiered LLM orchestrator.
	 *
	 * Lets the user pick which @mana/shared-llm tiers Mana is allowed to
	 * use. Each tier is a checkbox with an explanation of what it means
	 * for privacy + speed + cost. The cloud tier is gated behind an
	 * additional consent checkbox the first time it's enabled.
	 *
	 * Drops into the main settings page (/settings) as a self-contained
	 * Card section, mirroring the existing PasskeyManager / SessionManager
	 * pattern.
	 */
	import { llmSettingsState, updateLlmSettings, tierLabel, type LlmTier } from '@mana/shared-llm';
	import {
		isLocalLlmSupported,
		getLocalLlmStatus,
		loadLocalLlm,
		MODELS,
		DEFAULT_MODEL,
	} from '@mana/local-llm';
	import { Robot, Cpu, HardDrive, Cloud, Warning, CheckCircle } from '@mana/shared-icons';

	const settings = $derived(llmSettingsState.current);
	const webgpuSupported = isLocalLlmSupported();
	const localLlmStatus = getLocalLlmStatus();
	const defaultModelInfo = MODELS[DEFAULT_MODEL];

	let loadingBrowser = $state(false);

	function toggleTier(tier: LlmTier) {
		if (tier === 'none') return; // 'none' is implicit, not a real toggle
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

	// Tier card metadata — defined inline because it's specific to this UI
	// and changes alongside layout updates.
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

<div id="ai-options" class="scroll-mt-24 p-6">
	<div class="mb-6 flex items-center gap-3">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
		>
			<Robot size={20} />
		</div>
		<div>
			<div class="text-lg font-semibold">KI-Optionen</div>
			<p class="text-sm text-muted-foreground">
				Wähle, welche KI-Schichten Mana verwenden darf — von gar keiner bis zu allen
			</p>
		</div>
	</div>

	<!-- Tier 0 explainer -->
	<div class="mb-4 rounded-xl border border-border bg-muted/20 p-4">
		<div class="flex items-start gap-3">
			<CheckCircle size={20} class="mt-0.5 shrink-0 text-emerald-500" weight="fill" />
			<div>
				<p class="font-medium">Lokal (ohne KI) — immer aktiv</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Mana funktioniert auch ganz ohne KI: Datum-Erkennung, Suche und einfache Klassifikation
					laufen über klassische Algorithmen. Manche Funktionen sind dann begrenzt, dafür ist alles
					100% offline und kostet nichts.
				</p>
			</div>
		</div>
	</div>

	<!-- Tier 1-3 toggleable cards -->
	<div class="space-y-3">
		{#each tierCards as card}
			{@const enabled = isEnabled(card.tier)}
			{@const tierBlocked = card.tier === 'browser' && !webgpuSupported}
			<button
				type="button"
				onclick={() => !tierBlocked && toggleTier(card.tier)}
				disabled={tierBlocked}
				class="w-full rounded-xl border p-4 text-left transition-all {enabled
					? 'border-primary bg-primary/5 ring-1 ring-primary/30'
					: 'border-border bg-card hover:border-primary/40'} {tierBlocked
					? 'cursor-not-allowed opacity-50'
					: 'cursor-pointer'}"
			>
				<div class="flex items-start gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {enabled
							? 'bg-primary/20 text-primary'
							: 'bg-muted text-muted-foreground'}"
					>
						<card.icon size={20} />
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<div class="text-base font-semibold">{card.title}</div>
							{#if enabled}
								<span
									class="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground"
									>aktiv</span
								>
							{/if}
						</div>
						<p class="mt-0.5 text-sm text-muted-foreground">{card.subtitle}</p>
						<ul class="mt-2 space-y-1 text-xs text-muted-foreground">
							{#each card.bullets as bullet}
								<li class="flex items-start gap-1.5">
									<span class="mt-0.5 text-primary">•</span>
									<span>{bullet}</span>
								</li>
							{/each}
						</ul>
						{#if card.warning}
							<div
								class="mt-2 flex items-start gap-1.5 rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400"
							>
								<Warning size={12} weight="fill" class="mt-0.5 shrink-0" />
								<span>{card.warning}</span>
							</div>
						{/if}

						<!-- Per-tier extras -->
						{#if card.tier === 'browser' && enabled && webgpuSupported}
							<div class="mt-3 flex items-center gap-2 text-xs">
								{#if browserCacheReady}
									<span class="text-emerald-500">✓ Modell geladen</span>
								{:else if localLlmStatus.current.state === 'downloading'}
									<span class="text-muted-foreground">
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
										class="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
									>
										{loadingBrowser
											? 'Lade…'
											: `Modell laden (~${defaultModelInfo.downloadSizeMb} MB)`}
									</button>
								{/if}
							</div>
						{/if}

						{#if card.tier === 'browser' && tierBlocked}
							<p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
								WebGPU nicht verfügbar in deinem Browser. Funktioniert in Chrome/Edge 113+ oder
								Safari 18+.
							</p>
						{/if}

						{#if card.tier === 'cloud' && enabled && !settings.cloudConsentGiven}
							<div
								class="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3"
								onclick={(e) => e.stopPropagation()}
								onkeydown={(e) => e.stopPropagation()}
								role="presentation"
							>
								<p class="text-xs font-medium text-amber-700 dark:text-amber-400">
									Bestätigung erforderlich
								</p>
								<p class="mt-1 text-xs text-muted-foreground">
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
									class="mt-2 rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
								>
									Verstanden, Cloud aktivieren
								</button>
							</div>
						{/if}

						{#if card.tier === 'cloud' && enabled && settings.cloudConsentGiven}
							<div class="mt-3 flex items-center justify-between gap-2 text-xs">
								<span class="text-emerald-500">✓ Cloud-Zustimmung erteilt</span>
								<!-- svelte-ignore node_invalid_placement_ssr -->
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										setCloudConsent(false);
									}}
									class="text-muted-foreground hover:text-foreground"
								>
									Zurücknehmen
								</button>
							</div>
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Active tier chain summary -->
	<div class="mt-4 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
		<span class="font-medium text-foreground">Aktuelle Reihenfolge: </span>
		{#if settings.allowedTiers.length === 0}
			Nur lokal (ohne KI) — die meisten KI-Funktionen sind begrenzt.
		{:else}
			{settings.allowedTiers.map((t) => tierLabel(t)).join(' → ')} → Lokal (Fallback)
		{/if}
	</div>

	<!-- Behavior toggles -->
	<div class="mt-6 space-y-3 border-t border-border pt-4">
		<label class="flex cursor-pointer items-start gap-3">
			<input
				type="checkbox"
				checked={settings.fallbackToRulesOnError}
				onchange={(e) => setFallback((e.currentTarget as HTMLInputElement).checked)}
				class="mt-0.5 h-4 w-4 rounded border-border"
			/>
			<div>
				<div class="text-sm font-medium">Bei Fehler auf "Lokal" zurückfallen</div>
				<div class="text-xs text-muted-foreground">
					Wenn die gewählte KI-Schicht eine Anfrage nicht beantworten kann, versucht Mana es mit der
					lokalen Variante (sofern verfügbar). Aus: zeigt stattdessen einen Fehler an.
				</div>
			</div>
		</label>

		<label class="flex cursor-pointer items-start gap-3">
			<input
				type="checkbox"
				checked={settings.showSourceInUi}
				onchange={(e) => setShowSource((e.currentTarget as HTMLInputElement).checked)}
				class="mt-0.5 h-4 w-4 rounded border-border"
			/>
			<div>
				<div class="text-sm font-medium">Quelle bei jedem KI-Resultat anzeigen</div>
				<div class="text-xs text-muted-foreground">
					Zeigt unter jeder KI-generierten Antwort eine kleine Markierung wie "Auf deinem Gerät"
					oder "via Google Gemini" — damit du immer siehst, wo deine Daten gerade verarbeitet
					wurden.
				</div>
			</div>
		</label>
	</div>
</div>
