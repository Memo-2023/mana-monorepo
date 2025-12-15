<script lang="ts">
	import type { NodeKind, ContentData } from '$lib/types/content';

	interface Props {
		kind: NodeKind;
		onGenerated: (data: {
			title: string;
			summary: string;
			content: Partial<ContentData>;
			tags: string[];
		}) => void;
		context?: {
			world?: string;
			existingCharacters?: string[];
			existingPlaces?: string[];
			existingObjects?: string[];
		};
	}

	let { kind, onGenerated, context }: Props = $props();

	let isOpen = $state(false);
	let prompt = $state('');
	let generating = $state(false);
	let error = $state<string | null>(null);

	const kindLabels: Record<NodeKind, string> = {
		character: 'Charakter',
		world: 'Welt',
		place: 'Ort',
		object: 'Objekt',
		story: 'Story',
	};

	const placeholders: Record<NodeKind, string> = {
		character: 'Ein weiser alter Magier mit einem Geheimnis...',
		world: 'Eine düstere Cyberpunk-Welt mit magischen Elementen...',
		place: 'Ein mysteriöser Wald, in dem die Zeit anders verläuft...',
		object: 'Ein Amulett, das seinem Träger besondere Kräfte verleiht...',
		story: 'Eine Heldenreise, bei der ungleiche Gefährten zusammenfinden...',
	};

	async function generate() {
		if (!prompt.trim()) return;

		generating = true;
		error = null;

		try {
			const response = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind,
					prompt,
					context,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Generierung fehlgeschlagen');
			}

			const result = await response.json();
			onGenerated(result);
			isOpen = false;
			prompt = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			generating = false;
		}
	}

	function toggleDialog() {
		isOpen = !isOpen;
		if (!isOpen) {
			prompt = '';
			error = null;
		}
	}
</script>

<div class="relative">
	<button
		type="button"
		onclick={toggleDialog}
		class="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2"
	>
		<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 10V3L4 14h7v7l9-11h-7z"
			/>
		</svg>
		KI-Generierung
	</button>

	{#if isOpen}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div
				class="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0"
			>
				<!-- Background overlay -->
				<div
					class="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity"
					onclick={toggleDialog}
					role="button"
					tabindex="-1"
					aria-label="Close dialog"
				></div>

				<!-- Modal panel -->
				<div
					class="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
				>
					<div>
						<div
							class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100"
						>
							<svg
								class="h-6 w-6 text-violet-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<div class="mt-3 text-center sm:mt-5">
							<h3 class="text-lg font-medium leading-6 text-slate-900">
								{kindLabels[kind]} mit KI generieren
							</h3>
							<div class="mt-2">
								<p class="text-sm text-slate-500">
									Beschreibe, was du erstellen möchtest. Die KI generiert dann alle Details für
									dich.
								</p>
							</div>
						</div>
					</div>

					<div class="mt-5">
						{#if error}
							<div class="mb-4 rounded-md bg-red-50 p-4">
								<p class="text-sm text-red-800">{error}</p>
							</div>
						{/if}

						<textarea
							bind:value={prompt}
							disabled={generating}
							rows="4"
							placeholder={placeholders[kind]}
							class="w-full rounded-md border-slate-300 shadow-sm focus:border-theme-primary-500 focus:ring-theme-primary-500 disabled:opacity-50 sm:text-sm"
						></textarea>

						{#if context}
							<div class="mt-2 text-xs text-slate-500">
								{#if context.world}
									<p>Welt: {context.world}</p>
								{/if}
								{#if context.existingCharacters?.length}
									<p>Verfügbare Charaktere: {context.existingCharacters.slice(0, 3).join(', ')}</p>
								{/if}
								{#if context.existingPlaces?.length}
									<p>Verfügbare Orte: {context.existingPlaces.slice(0, 3).join(', ')}</p>
								{/if}
							</div>
						{/if}
					</div>

					<div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
						<button
							type="button"
							onclick={generate}
							disabled={generating || !prompt.trim()}
							class="inline-flex w-full justify-center rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:col-start-2 sm:text-sm"
						>
							{generating ? 'Generiere...' : 'Generieren'}
						</button>
						<button
							type="button"
							onclick={toggleDialog}
							disabled={generating}
							class="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2 disabled:opacity-50 sm:col-start-1 sm:mt-0 sm:text-sm"
						>
							Abbrechen
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
