<script lang="ts">
	import { Modal } from '@manacore/shared-ui';

	interface Blueprint {
		id: string;
		name: string;
		description: string | null;
	}

	interface Language {
		code: string;
		name: string;
	}

	interface Props {
		visible: boolean;
		currentLanguage: string;
		currentBlueprintId: string | null;
		currentDate: string;
		blueprints: Blueprint[];
		languages: Language[];
		onClose: () => void;
		onReprocess: (options: {
			language?: string;
			blueprintId?: string;
			recordingDate?: string;
		}) => void;
		isProcessing?: boolean;
	}

	let {
		visible,
		currentLanguage,
		currentBlueprintId,
		currentDate,
		blueprints,
		languages,
		onClose,
		onReprocess,
		isProcessing = false
	}: Props = $props();

	let selectedLanguage = $state(currentLanguage);
	let selectedBlueprintId = $state<string | null>(currentBlueprintId);
	let selectedDate = $state(currentDate);
	let hasChanges = $state(false);

	// Update state when props change
	$effect(() => {
		if (visible) {
			selectedLanguage = currentLanguage;
			selectedBlueprintId = currentBlueprintId;
			selectedDate = currentDate;
			checkForChanges();
		}
	});

	function checkForChanges() {
		hasChanges =
			selectedLanguage !== currentLanguage ||
			selectedBlueprintId !== currentBlueprintId ||
			selectedDate !== currentDate;
	}

	function handleLanguageChange(language: string) {
		selectedLanguage = language;
		checkForChanges();
	}

	function handleBlueprintChange(blueprintId: string) {
		selectedBlueprintId = blueprintId;
		checkForChanges();
	}

	function handleDateChange(e: Event) {
		selectedDate = (e.target as HTMLInputElement).value;
		checkForChanges();
	}

	function handleReprocess() {
		const options: {
			language?: string;
			blueprintId?: string;
			recordingDate?: string;
		} = {};

		if (selectedLanguage !== currentLanguage) {
			options.language = selectedLanguage;
		}

		if (selectedBlueprintId !== currentBlueprintId) {
			options.blueprintId = selectedBlueprintId || undefined;
		}

		if (selectedDate !== currentDate) {
			options.recordingDate = selectedDate;
		}

		onReprocess(options);
	}

	function handleReset() {
		selectedLanguage = currentLanguage;
		selectedBlueprintId = currentBlueprintId;
		selectedDate = currentDate;
		checkForChanges();
	}
</script>

<Modal {visible} {onClose} title="Reprocess Memo" maxWidth="2xl">
	{#snippet children()}
		<div class="space-y-6">
			<!-- Description -->
			<p class="text-sm text-theme-secondary">
				Reprocess this memo with different settings. Changes will trigger a new AI analysis and may
				consume Mana credits.
			</p>

			<!-- Language Selection -->
			<div class="space-y-2">
				<label class="text-sm font-medium text-theme-secondary">Language</label>
				<select
					value={selectedLanguage}
					onchange={(e) => handleLanguageChange((e.target as HTMLSelectElement).value)}
					disabled={isProcessing}
					class="w-full rounded-lg border border-theme bg-content px-4 py-2.5 text-theme focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
				>
					{#each languages as language (language.code)}
						<option value={language.code}>{language.name}</option>
					{/each}
				</select>
				<p class="text-xs text-theme-muted">
					Change the language for transcription and analysis
				</p>
			</div>

			<!-- Blueprint Selection -->
			<div class="space-y-2">
				<label class="text-sm font-medium text-theme-secondary">Blueprint (optional)</label>
				<div class="space-y-2 max-h-64 overflow-y-auto">
					<!-- No Blueprint Option -->
					<button
						onclick={() => handleBlueprintChange('')}
						disabled={isProcessing}
						class="w-full rounded-lg border-2 p-3 text-left transition-all {selectedBlueprintId ===
						null
							? 'border-primary bg-primary/10'
							: 'border-theme hover:bg-menu-hover'}"
					>
						<h4 class="font-semibold text-theme mb-1">No Blueprint</h4>
						<p class="text-xs text-theme-secondary">Process without a specific blueprint</p>
					</button>

					<!-- Blueprint Options -->
					{#each blueprints as blueprint (blueprint.id)}
						<button
							onclick={() => handleBlueprintChange(blueprint.id)}
							disabled={isProcessing}
							class="w-full rounded-lg border-2 p-3 text-left transition-all {selectedBlueprintId ===
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
			</div>

			<!-- Recording Date -->
			<div class="space-y-2">
				<label class="text-sm font-medium text-theme-secondary">Recording Date</label>
				<input
					type="datetime-local"
					value={selectedDate}
					oninput={handleDateChange}
					disabled={isProcessing}
					class="w-full rounded-lg border border-theme bg-content px-4 py-2.5 text-theme focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
				/>
				<p class="text-xs text-theme-muted">Adjust the recording date and time</p>
			</div>

			<!-- Changes Summary -->
			{#if hasChanges}
				<div class="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
					<div class="flex items-start gap-2">
						<svg
							class="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-500"
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
							<p class="text-sm font-medium text-blue-800 dark:text-blue-200">
								Changes detected
							</p>
							<ul class="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-0.5">
								{#if selectedLanguage !== currentLanguage}
									<li>• Language will be changed</li>
								{/if}
								{#if selectedBlueprintId !== currentBlueprintId}
									<li>• Blueprint will be changed</li>
								{/if}
								{#if selectedDate !== currentDate}
									<li>• Recording date will be updated</li>
								{/if}
							</ul>
						</div>
					</div>
				</div>
			{/if}

			<!-- Warning -->
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
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
							Reprocessing will consume Mana credits
						</p>
						<p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
							This operation will re-analyze the entire memo and may take several minutes. All
							existing memories will be replaced.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-between">
			<button
				onclick={handleReset}
				disabled={!hasChanges || isProcessing}
				class="btn-secondary disabled:opacity-50"
			>
				Reset
			</button>
			<div class="flex gap-3">
				<button onclick={onClose} disabled={isProcessing} class="btn-secondary">Cancel</button>
				<button
					onclick={handleReprocess}
					disabled={!hasChanges || isProcessing}
					class="btn-primary disabled:opacity-50"
				>
					{#if isProcessing}
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
						<span>Processing...</span>
					{:else}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						<span>Reprocess Memo</span>
					{/if}
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
