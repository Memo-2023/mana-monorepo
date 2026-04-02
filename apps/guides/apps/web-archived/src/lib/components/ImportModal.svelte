<script lang="ts">
	import { guidesStore as dbStore } from '$lib/data/local-store.js';
	import { guidesStore } from '$lib/stores/guides.svelte.js';

	const SERVER_URL = import.meta.env.PUBLIC_GUIDES_SERVER_URL || 'http://localhost:3027';

	interface ImportedGuide {
		title: string;
		description?: string;
		category?: string;
		difficulty?: string;
		estimatedMinutes?: number;
		tags?: string[];
		sourceUrl?: string;
	}

	interface ImportedSection {
		title: string;
		steps: { title: string; content?: string; type?: string }[];
	}

	interface Props {
		open: boolean;
		onClose: () => void;
		onImported: (guideId: string) => void;
	}

	let { open, onClose, onImported }: Props = $props();

	type Tab = 'url' | 'text' | 'ai';
	let activeTab = $state<Tab>('url');
	let loading = $state(false);
	let error = $state('');

	// URL tab
	let urlInput = $state('');

	// Text tab
	let textInput = $state('');
	let textTitle = $state('');

	// AI tab
	let aiPrompt = $state('');
	let aiTitle = $state('');

	// Preview
	let preview = $state<{ guide: ImportedGuide; sections: ImportedSection[] } | null>(null);

	function reset() {
		urlInput = '';
		textInput = '';
		textTitle = '';
		aiPrompt = '';
		aiTitle = '';
		preview = null;
		error = '';
		activeTab = 'url';
	}

	function handleClose() {
		reset();
		onClose();
	}

	async function fetchImport(endpoint: string, body: Record<string, string>) {
		loading = true;
		error = '';
		preview = null;
		try {
			const res = await fetch(`${SERVER_URL}/api/v1/import/${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const data = await res.json<{ guide?: ImportedGuide; sections?: ImportedSection[]; error?: string }>();
			if (!res.ok || data.error) {
				error = data.error ?? 'Import fehlgeschlagen';
				return;
			}
			if (data.guide) {
				preview = { guide: data.guide, sections: data.sections ?? [] };
			}
		} catch (e) {
			error = 'Server nicht erreichbar';
		} finally {
			loading = false;
		}
	}

	async function handleUrlImport() {
		if (!urlInput.trim()) return;
		await fetchImport('url', { url: urlInput.trim() });
	}

	async function handleTextImport() {
		if (!textInput.trim()) return;
		await fetchImport('text', { text: textInput, title: textTitle });
	}

	async function handleAiImport() {
		if (!aiPrompt.trim()) return;
		await fetchImport('ai', { prompt: aiPrompt, title: aiTitle });
	}

	async function saveGuide() {
		if (!preview) return;
		loading = true;
		try {
			const { guide, sections } = preview;

			// Create guide
			const guideId = await guidesStore.createGuide({
				title: guide.title,
				description: guide.description,
				category: guide.category ?? 'Allgemein',
				difficulty: (guide.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
				estimatedMinutes: guide.estimatedMinutes,
				tags: guide.tags ?? [],
				coverEmoji: '📖',
				collectionId: undefined,
				orderInCollection: undefined,
				xpReward: undefined,
				skillId: undefined,
			});

			// Create sections and steps
			let globalStepOrder = 0;
			for (let si = 0; si < sections.length; si++) {
				const sec = sections[si];
				let sectionId: string | undefined;

				if (sections.length > 1 || sec.title) {
					sectionId = await guidesStore.createSection(guideId, {
						title: sec.title,
						order: si,
					});
				}

				for (const step of sec.steps ?? []) {
					await guidesStore.createStep(guideId, {
						sectionId,
						order: globalStepOrder++,
						title: step.title,
						content: step.content,
						type: (step.type as 'instruction' | 'warning' | 'tip' | 'checkpoint' | 'code') ?? 'instruction',
						checkable: true,
					});
				}
			}

			reset();
			onImported(guideId);
		} catch (e) {
			error = 'Speichern fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	const difficultyLabel: Record<string, string> = { easy: 'Einfach', medium: 'Mittel', hard: 'Schwer' };
	const totalSteps = $derived(preview?.sections.reduce((n, s) => n + (s.steps?.length ?? 0), 0) ?? 0);
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
		role="dialog"
		aria-modal="true"
		onclick={handleClose}
	>
		<div
			class="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
				<h2 class="text-lg font-semibold dark:text-white">Guide importieren</h2>
				<button onclick={handleClose} class="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Schließen">
					<svg width="20" height="20" viewBox="0 0 256 256" class="text-neutral-500"><path fill="currentColor" d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z"/></svg>
				</button>
			</div>

			{#if !preview}
				<!-- Tab bar -->
				<div class="flex border-b border-neutral-200 dark:border-neutral-700">
					{#each [['url', '🔗 URL'], ['text', '📝 Text'], ['ai', '✨ KI']] as [tab, label]}
						<button
							onclick={() => { activeTab = tab as Tab; error = ''; }}
							class="flex-1 py-3 text-sm font-medium transition-colors {activeTab === tab
								? 'text-teal-600 border-b-2 border-teal-600 dark:text-teal-400 dark:border-teal-400'
								: 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}"
						>
							{label}
						</button>
					{/each}
				</div>

				<!-- Tab content -->
				<div class="flex-1 overflow-y-auto p-5 space-y-4">
					{#if activeTab === 'url'}
						<div>
							<label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">URL</label>
							<input
								type="url"
								bind:value={urlInput}
								placeholder="https://example.com/tutorial"
								class="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
								onkeydown={(e) => e.key === 'Enter' && handleUrlImport()}
							/>
							<p class="mt-1 text-xs text-neutral-400">Webseite wird extrahiert und in eine Anleitung umgewandelt</p>
						</div>
					{:else if activeTab === 'text'}
						<div>
							<label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Titel (optional)</label>
							<input
								type="text"
								bind:value={textTitle}
								placeholder="Meine Anleitung"
								class="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Text / Markdown</label>
							<textarea
								bind:value={textInput}
								placeholder="Füge hier Text, Markdown oder eine Anleitung ein..."
								rows="8"
								class="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
							></textarea>
						</div>
					{:else if activeTab === 'ai'}
						<div>
							<label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Titel (optional)</label>
							<input
								type="text"
								bind:value={aiTitle}
								placeholder="z. B. Docker einrichten"
								class="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Was soll die Anleitung erklären?</label>
							<textarea
								bind:value={aiPrompt}
								placeholder="z. B. Wie richte ich einen Ubuntu-Server mit Nginx, Let's Encrypt und automatischen Updates ein?"
								rows="5"
								class="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
								onkeydown={(e) => e.key === 'Enter' && e.metaKey && handleAiImport()}
							></textarea>
							<p class="mt-1 text-xs text-neutral-400">⌘↵ zum Generieren</p>
						</div>
					{/if}

					{#if error}
						<p class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
					{/if}
				</div>

				<!-- Footer -->
				<div class="px-5 py-4 border-t border-neutral-200 dark:border-neutral-700">
					<button
						onclick={activeTab === 'url' ? handleUrlImport : activeTab === 'text' ? handleTextImport : handleAiImport}
						disabled={loading || (activeTab === 'url' ? !urlInput.trim() : activeTab === 'text' ? !textInput.trim() : !aiPrompt.trim())}
						class="w-full py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
					>
						{#if loading}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
							Verarbeite…
						{:else}
							{activeTab === 'ai' ? '✨ Guide generieren' : '🔍 Importieren'}
						{/if}
					</button>
				</div>

			{:else}
				<!-- Preview -->
				<div class="flex-1 overflow-y-auto p-5 space-y-4">
					<div class="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 space-y-1">
						<h3 class="font-semibold text-teal-900 dark:text-teal-100 text-base">{preview.guide.title}</h3>
						{#if preview.guide.description}
							<p class="text-sm text-teal-700 dark:text-teal-300">{preview.guide.description}</p>
						{/if}
						<div class="flex flex-wrap gap-2 pt-1">
							<span class="text-xs bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 px-2 py-0.5 rounded-full">{preview.guide.category ?? 'Allgemein'}</span>
							<span class="text-xs bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 px-2 py-0.5 rounded-full">{difficultyLabel[preview.guide.difficulty ?? 'medium'] ?? preview.guide.difficulty}</span>
							{#if preview.guide.estimatedMinutes}
								<span class="text-xs bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 px-2 py-0.5 rounded-full">⏱ {preview.guide.estimatedMinutes} Min.</span>
							{/if}
							<span class="text-xs bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 px-2 py-0.5 rounded-full">{totalSteps} Schritte</span>
						</div>
					</div>

					{#each preview.sections as section, si}
						{#if section.title}
							<p class="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mt-3">{section.title}</p>
						{/if}
						{#each section.steps as step, i}
							<div class="flex gap-3 items-start">
								<span class="shrink-0 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
								<div>
									<p class="text-sm font-medium dark:text-white">{step.title}</p>
									{#if step.content}
										<p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{step.content}</p>
									{/if}
								</div>
							</div>
						{/each}
					{/each}

					{#if error}
						<p class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
					{/if}
				</div>

				<!-- Preview footer -->
				<div class="px-5 py-4 border-t border-neutral-200 dark:border-neutral-700 flex gap-3">
					<button
						onclick={() => { preview = null; error = ''; }}
						class="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
					>
						Zurück
					</button>
					<button
						onclick={saveGuide}
						disabled={loading}
						class="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
					>
						{#if loading}
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
						{/if}
						Guide speichern
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
