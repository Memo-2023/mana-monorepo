<script lang="ts">
	import { createAuthClient } from '$lib/supabaseClient';
	import Modal from './Modal.svelte';

	interface Prompt {
		id: string;
		memory_title: {
			de?: string;
			en?: string;
		};
		prompt_text: {
			de?: string;
			en?: string;
		};
		sort_order?: number;
		created_at?: string;
	}

	interface Blueprint {
		id: string;
		name: {
			de?: string;
			en?: string;
		};
		description?: {
			de?: string;
			en?: string;
		};
		prompts?: Prompt[];
	}

	interface Props {
		visible: boolean;
		onClose: () => void;
		blueprint: Blueprint | null;
		isActive: boolean;
		onToggleActive: (id: string) => Promise<void>;
	}

	let { visible, onClose, blueprint, isActive, onToggleActive }: Props = $props();

	const lang = 'de'; // Can be replaced with i18n store

	const displayName = $derived(
		blueprint?.name?.[lang] || blueprint?.name?.en || blueprint?.name?.de || ''
	);
	const displayDescription = $derived(
		blueprint?.description?.[lang] || blueprint?.description?.en || blueprint?.description?.de || ''
	);

	let prompts = $state<Prompt[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isActivating = $state(false);

	// Load prompts when modal opens
	$effect(() => {
		if (visible && blueprint) {
			loadPrompts();
		}
	});

	async function loadPrompts() {
		if (!blueprint) return;

		try {
			loading = true;
			error = null;

			const supabase = await createAuthClient();

			// Fetch prompt links
			const { data: promptLinks, error: promptLinksError } = await supabase
				.from('prompt_blueprints')
				.select('prompt_id')
				.eq('blueprint_id', blueprint.id);

			if (promptLinksError) {
				error = 'Error loading prompts';
				prompts = [];
				return;
			}

			if (!promptLinks || promptLinks.length === 0) {
				prompts = [];
				return;
			}

			// Extract prompt IDs
			const promptIds = promptLinks.map((link) => link.prompt_id);

			// Fetch prompts
			const { data: promptsData, error: promptsError } = await supabase
				.from('prompts')
				.select('*')
				.in('id', promptIds);

			if (promptsError) {
				error = 'Error loading prompts';
				prompts = [];
				return;
			}

			if (!promptsData || promptsData.length === 0) {
				prompts = [];
				return;
			}

			// Sort prompts by sort_order (ascending) then created_at (descending)
			const sortedPrompts = [...promptsData].sort((a, b) => {
				// First sort by sort_order (ascending)
				if (a.sort_order !== undefined && b.sort_order !== undefined) {
					if (a.sort_order !== b.sort_order) {
						return a.sort_order - b.sort_order;
					}
				} else if (a.sort_order !== undefined) {
					return -1;
				} else if (b.sort_order !== undefined) {
					return 1;
				}

				// Then sort by created_at (descending - newest first)
				if (a.created_at && b.created_at) {
					return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
				}

				return 0;
			});

			prompts = sortedPrompts;
		} catch (err) {
			error = 'An unexpected error occurred';
			prompts = [];
		} finally {
			loading = false;
		}
	}

	async function handleToggleActive() {
		if (!blueprint) return;

		isActivating = true;
		try {
			await onToggleActive(blueprint.id);
		} finally {
			isActivating = false;
		}
	}

	function handleStartRecording() {
		// TODO: Navigate to recording page with selected blueprint
		console.log('Start recording with blueprint:', blueprint?.id);
		onClose();
	}
</script>

{#if blueprint}
	<Modal visible={visible} onClose={onClose} title="Vorlage: {displayName}">
		{#snippet children()}
			<!-- Description -->
			{#if displayDescription}
				<p class="mb-6 text-base text-theme-secondary">
					{displayDescription}
				</p>
			{/if}

			<!-- Prompts Section -->
			<h3 class="mb-4 text-lg font-bold text-theme">Prompts</h3>

			<div class="min-h-[200px]">
				{#if loading}
					<!-- Skeleton Loader -->
					<div class="space-y-3">
						{#each Array(3) as _, i}
							<div class="rounded-xl bg-menu p-4">
								<div
									class="mb-2 h-4 animate-pulse rounded bg-menu-hover"
									style="width: {60 + i * 15}%"
								></div>
								<div class="mb-1 h-3 animate-pulse rounded bg-menu-hover" style="width: 100%"></div>
								<div
									class="h-3 animate-pulse rounded bg-menu-hover"
									style="width: {70 + i * 10}%"
								></div>
							</div>
						{/each}
					</div>
				{:else if error}
					<!-- Error State -->
					<div class="py-4">
						<p class="text-red-500">{error}</p>
					</div>
				{:else if prompts.length === 0}
					<!-- Empty State -->
					<div class="py-4">
						<p class="text-theme-secondary">Keine Prompts für diesen Blueprint verfügbar.</p>
					</div>
				{:else}
					<!-- Prompts List -->
					<div class="space-y-3">
						{#each prompts as prompt (prompt.id)}
							<div class="rounded-xl border border-theme bg-content-hover p-4 shadow-sm">
								<h4 class="mb-1 text-base font-semibold text-theme">
									{prompt.memory_title?.[lang] ||
										prompt.memory_title?.en ||
										prompt.memory_title?.de ||
										'Unbenannter Prompt'}
								</h4>
								<p class="line-clamp-2 text-sm text-theme-secondary">
									{prompt.prompt_text?.[lang] ||
										prompt.prompt_text?.en ||
										prompt.prompt_text?.de ||
										''}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet footer()}
			<div class="flex gap-3">
				<!-- Pin/Unpin Button -->
				<button
					onclick={handleToggleActive}
					class="btn-secondary flex flex-1 items-center justify-center gap-2"
					disabled={isActivating}
				>
					{#if isActivating}
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
					{:else}
						<svg
							class="h-5 w-5"
							fill={isActive ? 'currentColor' : 'none'}
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
							/>
						</svg>
					{/if}
					<span>{isActive ? 'Entpinnen' : 'Anpinnen'}</span>
				</button>

				<!-- Record Button -->
				<button
					onclick={handleStartRecording}
					class="btn-primary flex flex-1 items-center justify-center gap-2"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
						/>
					</svg>
					<span>Aufnehmen</span>
				</button>
			</div>
		{/snippet}
	</Modal>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
