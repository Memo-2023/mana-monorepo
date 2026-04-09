<script lang="ts">
	/**
	 * Onboarding step: introduces the four LLM tiers and lets the user
	 * pick which ones Mana is allowed to use. Same routing semantics as
	 * the AiSettings card on the main settings page, but compressed into
	 * a single onboarding screen with a "you can change this anytime"
	 * note at the bottom.
	 *
	 * Default: nothing selected → user explicitly opts in.
	 */
	import { llmSettingsState, updateLlmSettings, tierLabel, type LlmTier } from '@mana/shared-llm';
	import { isLocalLlmSupported } from '@mana/local-llm';
	import { Robot, Cpu, HardDrive, Cloud, CheckCircle, Info } from '@mana/shared-icons';

	const settings = $derived(llmSettingsState.current);
	const webgpuSupported = isLocalLlmSupported();

	function toggleTier(tier: LlmTier) {
		const current = settings.allowedTiers;
		const next = current.includes(tier) ? current.filter((t) => t !== tier) : [...current, tier];
		updateLlmSettings({ allowedTiers: next });
	}

	const cards = [
		{
			tier: 'browser' as LlmTier,
			icon: Cpu,
			title: 'Auf deinem Gerät',
			tagline: 'Maximale Privatsphäre',
			description: 'Gemma 4 läuft direkt im Browser. ~500 MB einmaliger Download.',
			privacyDot: 'bg-emerald-500',
			disabled: !webgpuSupported,
			disabledHint: 'Braucht WebGPU (Chrome 113+, Safari 18+).',
		},
		{
			tier: 'mana-server' as LlmTier,
			icon: HardDrive,
			title: 'Mana-Server',
			tagline: 'Selbst-gehostet',
			description: 'Anfragen laufen zu unserem Server. Schneller, immer noch privat.',
			privacyDot: 'bg-blue-500',
			disabled: false,
		},
		{
			tier: 'cloud' as LlmTier,
			icon: Cloud,
			title: 'Google Gemini',
			tagline: 'Stärkstes Modell',
			description: 'Beste Qualität für komplexe Aufgaben — Daten gehen zu Google.',
			privacyDot: 'bg-amber-500',
			disabled: false,
		},
	];
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-6 text-center">
		<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
			<Robot size={28} class="text-primary" />
		</div>
		<div class="mb-2 text-2xl font-bold">Wie soll Mana KI nutzen?</div>
		<p class="text-muted-foreground">
			Mana bietet KI-Funktionen auf vier Ebenen — von "gar keine" bis zu allem. Du entscheidest,
			welche Schichten dein Vertrauen haben.
		</p>
	</div>

	<!-- Always-on tier 0 -->
	<div class="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
		<div class="flex items-center gap-3">
			<CheckCircle size={20} weight="fill" class="text-emerald-500" />
			<div class="flex-1">
				<div class="font-semibold">Lokal (ohne KI) — immer aktiv</div>
				<div class="text-sm text-muted-foreground">
					Datum-Erkennung, Suche und einfache Klassifikation laufen offline ohne KI. Brauchst du
					nichts auswählen — das ist immer da.
				</div>
			</div>
		</div>
	</div>

	<!-- Toggleable tiers -->
	<div class="space-y-3">
		{#each cards as card}
			{@const enabled = settings.allowedTiers.includes(card.tier)}
			<button
				type="button"
				onclick={() => !card.disabled && toggleTier(card.tier)}
				disabled={card.disabled}
				class="w-full rounded-xl border p-4 text-left transition-all {enabled
					? 'border-primary bg-primary/5 ring-1 ring-primary/30'
					: 'border-border bg-card hover:border-primary/40'} {card.disabled
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
							<span class="h-1.5 w-1.5 rounded-full {card.privacyDot}"></span>
							<span class="text-xs text-muted-foreground">{card.tagline}</span>
							{#if enabled}
								<span
									class="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground"
								>
									aktiv
								</span>
							{/if}
						</div>
						<p class="mt-1 text-sm text-muted-foreground">{card.description}</p>
						{#if card.disabled && card.disabledHint}
							<p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
								{card.disabledHint}
							</p>
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Live chain summary -->
	{#if settings.allowedTiers.length > 0}
		<div class="mt-4 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
			<span class="font-medium text-foreground">Reihenfolge: </span>
			{settings.allowedTiers.map((t) => tierLabel(t)).join(' → ')} → Lokal (Fallback)
		</div>
	{/if}

	<div class="mt-6 flex items-start gap-3 rounded-xl bg-primary/5 p-4">
		<Info size={20} class="mt-0.5 shrink-0 text-primary" />
		<div class="text-sm text-muted-foreground">
			Du kannst diese Auswahl jederzeit in den Einstellungen ändern. Es ist auch komplett okay, hier
			nichts auszuwählen — KI-Funktionen sind in Mana optional und alle Kern-Features funktionieren
			ohne sie.
		</div>
	</div>
</div>
