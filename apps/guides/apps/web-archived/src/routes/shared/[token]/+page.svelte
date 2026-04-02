<script lang="ts">
	import { page } from '$app/stores';

	const SERVER_URL = import.meta.env.PUBLIC_GUIDES_SERVER_URL || 'http://localhost:3027';

	interface SharedStep {
		id: string;
		title: string;
		content?: string;
		type?: string;
		checkable?: boolean;
	}

	interface SharedGuide {
		title: string;
		description?: string;
		category?: string;
		difficulty?: string;
		estimatedMinutes?: number;
		tags?: string[];
		coverEmoji?: string;
		coverColor?: string;
	}

	let token = $derived($page.params.token);

	type State = 'loading' | 'loaded' | 'error' | 'expired';
	let state = $state<State>('loading');
	let guide = $state<SharedGuide | null>(null);
	let steps = $state<SharedStep[]>([]);
	let errorMsg = $state('');

	// Checklist state (local only — shared guides are read-only)
	let checked = $state<Record<string, boolean>>({});

	$effect(() => {
		const t = token;
		state = 'loading';
		fetch(`${SERVER_URL}/api/v1/share/${t}`)
			.then(async (res) => {
				if (res.status === 410) { state = 'expired'; return; }
				if (!res.ok) { state = 'error'; errorMsg = 'Guide nicht gefunden'; return; }
				const data = await res.json<{ guide: SharedGuide; sections: SharedStep[] | { steps: SharedStep[] }[] }>();
				guide = data.guide as SharedGuide;
				// flatten sections → steps
				const raw = data.sections as unknown[];
				if (raw.length > 0 && 'steps' in (raw[0] as object)) {
					steps = (raw as { steps: SharedStep[] }[]).flatMap((s) => s.steps ?? []);
				} else {
					steps = raw as SharedStep[];
				}
				state = 'loaded';
			})
			.catch(() => { state = 'error'; errorMsg = 'Server nicht erreichbar'; });
	});

	const difficultyLabel: Record<string, string> = { easy: 'Einfach', medium: 'Mittel', hard: 'Schwer' };
	const progress = $derived(
		steps.filter((s) => s.checkable).length > 0
			? Math.round(
					(steps.filter((s) => s.checkable && checked[s.id]).length /
						steps.filter((s) => s.checkable).length) *
						100
				)
			: 0
	);

	const stepTypeConfig: Record<string, { icon: string; border: string; bg: string }> = {
		instruction: { icon: '→', border: 'border-l-teal-500', bg: '' },
		warning:     { icon: '⚠', border: 'border-l-orange-400', bg: 'bg-orange-50/50 dark:bg-orange-950/20' },
		tip:         { icon: '💡', border: 'border-l-violet-400', bg: 'bg-violet-50/50 dark:bg-violet-950/20' },
		checkpoint:  { icon: '✓', border: 'border-l-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/20' },
		code:        { icon: '</>', border: 'border-l-slate-400', bg: 'bg-slate-50/50 dark:bg-slate-950/20 font-mono text-xs' },
	};
</script>

<svelte:head>
	{#if guide}
		<title>{guide.title} — Mana Guides</title>
		<meta name="description" content={guide.description ?? ''} />
	{:else}
		<title>Geteilte Anleitung — Mana Guides</title>
	{/if}
</svelte:head>

<div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
	<div class="mx-auto max-w-2xl px-4 py-8">

		{#if state === 'loading'}
			<div class="flex items-center justify-center py-24">
				<svg class="animate-spin h-8 w-8 text-teal-600" viewBox="0 0 24 24" fill="none">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
				</svg>
			</div>

		{:else if state === 'expired'}
			<div class="flex flex-col items-center justify-center py-24 text-center">
				<span class="mb-4 text-5xl">⏳</span>
				<h1 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">Link abgelaufen</h1>
				<p class="text-sm text-neutral-500">Dieser Freigabe-Link ist nicht mehr gültig (nach 7 Tagen abgelaufen).</p>
				<a href="/" class="mt-6 text-sm text-teal-600 hover:underline">Zur Guides-App →</a>
			</div>

		{:else if state === 'error'}
			<div class="flex flex-col items-center justify-center py-24 text-center">
				<span class="mb-4 text-5xl">❌</span>
				<h1 class="text-xl font-bold text-neutral-900 dark:text-white mb-2">{errorMsg}</h1>
				<a href="/" class="mt-6 text-sm text-teal-600 hover:underline">Zur Guides-App →</a>
			</div>

		{:else if guide}
			<!-- Branding strip -->
			<div class="mb-6 flex items-center gap-2">
				<span class="text-xl">📖</span>
				<span class="text-sm font-semibold text-teal-600">Mana Guides</span>
				<span class="ml-auto text-xs text-neutral-400">Geteilte Anleitung</span>
			</div>

			<!-- Cover -->
			<div class="mb-6 rounded-2xl p-5" style="background-color: {guide.coverColor ?? '#0d9488'}18">
				<div class="flex items-start gap-4">
					<span class="text-5xl">{guide.coverEmoji ?? '📖'}</span>
					<div>
						<h1 class="text-xl font-bold text-neutral-900 dark:text-white">{guide.title}</h1>
						{#if guide.description}
							<p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{guide.description}</p>
						{/if}
						<div class="mt-2 flex flex-wrap gap-2">
							{#if guide.difficulty}
								<span class="text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
									{difficultyLabel[guide.difficulty] ?? guide.difficulty}
								</span>
							{/if}
							{#if guide.estimatedMinutes}
								<span class="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full">
									⏱ {guide.estimatedMinutes} Min.
								</span>
							{/if}
							<span class="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full">
								{steps.length} Schritte
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Progress (if any checkable steps) -->
			{#if steps.some((s) => s.checkable)}
				<div class="mb-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4">
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Fortschritt</span>
						<span class="text-sm text-teal-600 font-semibold">{progress}%</span>
					</div>
					<div class="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
						<div class="h-full bg-teal-500 rounded-full transition-all" style="width: {progress}%"></div>
					</div>
				</div>
			{/if}

			<!-- Steps -->
			<div class="space-y-3">
				{#each steps as step, i}
					{@const cfg = stepTypeConfig[step.type ?? 'instruction'] ?? stepTypeConfig.instruction}
					<div
						class="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 border-l-4 {cfg.border} {cfg.bg} overflow-hidden"
					>
						<div class="p-4 flex gap-3 items-start">
							{#if step.checkable}
								<button
									onclick={() => { checked[step.id] = !checked[step.id]; }}
									class="shrink-0 mt-0.5 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center
									{checked[step.id]
										? 'bg-teal-600 border-teal-600 text-white'
										: 'border-neutral-300 dark:border-neutral-600 hover:border-teal-400'}"
									aria-label="Schritt abhaken"
								>
									{#if checked[step.id]}
										<svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="m229.66 77.66-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69 218.34 66.34a8 8 0 0 1 11.32 11.32Z"/></svg>
									{/if}
								</button>
							{:else}
								<span class="shrink-0 mt-0.5 text-sm text-neutral-400">{cfg.icon}</span>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-neutral-900 dark:text-white {checked[step.id] ? 'line-through text-neutral-400' : ''}">
									{i + 1}. {step.title}
								</p>
								{#if step.content}
									<p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">{step.content}</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- CTA -->
			<div class="mt-10 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-5 text-center">
				<p class="text-sm font-semibold text-teal-800 dark:text-teal-200 mb-1">Eigene Anleitungen erstellen?</p>
				<p class="text-xs text-teal-600 dark:text-teal-400 mb-4">Mit Mana Guides kannst du SOPs, Rezepte, Tutorials und Lernpfade erstellen — kostenlos.</p>
				<a
					href="/"
					class="inline-block rounded-xl bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 hover:bg-teal-700 transition-colors"
				>
					Mana Guides ausprobieren →
				</a>
			</div>
		{/if}
	</div>
</div>
