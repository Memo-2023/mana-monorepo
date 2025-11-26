<script lang="ts">
	import { Modal } from '@manacore/shared-ui';

	interface Blueprint {
		id: string;
		name: string;
		description: string | null;
		prompt: string;
	}

	interface Props {
		visible: boolean;
		blueprints: Blueprint[];
		onClose: () => void;
		onCreate: (blueprintId: string | null, customPrompt?: string) => void;
		isCreating?: boolean;
	}

	let { visible, blueprints, onClose, onCreate, isCreating = false }: Props = $props();

	let selectedBlueprintId = $state<string | null>(null);
	let useCustomPrompt = $state(false);
	let customPrompt = $state('');

	function handleCreate() {
		if (useCustomPrompt && customPrompt.trim()) {
			onCreate(null, customPrompt.trim());
		} else if (selectedBlueprintId) {
			onCreate(selectedBlueprintId);
		}
	}

	function resetForm() {
		selectedBlueprintId = null;
		useCustomPrompt = false;
		customPrompt = '';
	}

	// Reset form when modal closes
	$effect(() => {
		if (!visible) {
			resetForm();
		}
	});
</script>

<Modal {visible} {onClose} title="Create Memory" maxWidth="lg">
	{#snippet children()}
		<div class="space-y-4">
			<!-- Description -->
			<p class="text-sm text-theme-secondary">
				Create a new AI-generated memory from this memo using a blueprint or custom prompt.
			</p>

			<!-- Blueprint Selection -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<label class="text-sm font-medium text-theme-secondary">Choose a Blueprint</label>
					<button
						onclick={() => (useCustomPrompt = !useCustomPrompt)}
						class="text-xs text-primary hover:underline"
					>
						{useCustomPrompt ? 'Use Blueprint' : 'Use Custom Prompt'}
					</button>
				</div>

				{#if !useCustomPrompt}
					<!-- Blueprint Grid -->
					<div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto sm:grid-cols-2">
						{#each blueprints as blueprint (blueprint.id)}
							<button
								onclick={() => (selectedBlueprintId = blueprint.id)}
								class="rounded-lg border-2 p-3 text-left transition-all {selectedBlueprintId ===
								blueprint.id
									? 'border-primary bg-primary/10'
									: 'border-theme hover:bg-menu-hover'}"
							>
								<h4 class="font-semibold text-theme mb-1">{blueprint.name}</h4>
								{#if blueprint.description}
									<p class="text-xs text-theme-secondary line-clamp-2">
										{blueprint.description}
									</p>
								{/if}
							</button>
						{/each}
					</div>

					{#if blueprints.length === 0}
						<div class="rounded-lg bg-content p-8 text-center">
							<p class="text-theme-secondary">No blueprints available. Use a custom prompt instead.</p>
						</div>
					{/if}
				{:else}
					<!-- Custom Prompt -->
					<div class="space-y-2">
						<label class="text-sm font-medium text-theme-secondary">Custom Prompt</label>
						<textarea
							bind:value={customPrompt}
							placeholder="Enter your custom analysis prompt..."
							rows="6"
							class="w-full rounded-lg border border-theme bg-content p-3 text-theme focus:outline-none focus:ring-2 focus:ring-primary resize-none"
						/>
						<p class="text-xs text-theme-muted">
							Example: "Summarize the main action items from this meeting."
						</p>
					</div>
				{/if}
			</div>

			<!-- Cost Info -->
			<div class="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
				<div class="flex items-start gap-2">
					<svg
						class="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
							Creating a memory will consume Mana credits
						</p>
						<p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
							The cost depends on the length of your transcript and the complexity of the analysis.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<button onclick={onClose} disabled={isCreating} class="btn-secondary">Cancel</button>
			<button
				onclick={handleCreate}
				disabled={isCreating || (!selectedBlueprintId && !customPrompt.trim())}
				class="btn-primary"
			>
				{#if isCreating}
					<svg
						class="h-4 w-4 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					<span>Creating...</span>
				{:else}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					<span>Create Memory</span>
				{/if}
			</button>
		</div>
	{/snippet}
</Modal>
