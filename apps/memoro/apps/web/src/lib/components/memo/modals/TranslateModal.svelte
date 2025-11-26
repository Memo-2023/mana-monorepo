<script lang="ts">
	import { Modal } from '@manacore/shared-ui';

	interface Language {
		code: string;
		name: string;
	}

	interface Props {
		visible: boolean;
		currentLanguage: string;
		languages: Language[];
		onClose: () => void;
		onTranslate: (targetLanguage: string) => void;
		isTranslating?: boolean;
	}

	let {
		visible,
		currentLanguage,
		languages,
		onClose,
		onTranslate,
		isTranslating = false
	}: Props = $props();

	let selectedLanguage = $state('');

	// Reset when modal opens
	$effect(() => {
		if (visible) {
			selectedLanguage = '';
		}
	});

	function handleTranslate() {
		if (selectedLanguage) {
			onTranslate(selectedLanguage);
		}
	}

	// Get current language name
	const currentLanguageName = $derived(
		languages.find((lang) => lang.code === currentLanguage)?.name || currentLanguage
	);

	// Filter out current language from options
	const availableLanguages = $derived(languages.filter((lang) => lang.code !== currentLanguage));
</script>

<Modal {visible} {onClose} title="Translate Memo" maxWidth="lg">
	{#snippet children()}
		<div class="space-y-4">
			<!-- Description -->
			<p class="text-sm text-theme-secondary">
				Translate this memo to another language. The AI will translate both the transcript and any
				existing memories.
			</p>

			<!-- Current Language -->
			<div class="rounded-lg bg-content p-4 border border-theme">
				<div class="flex items-center gap-3">
					<svg
						class="h-5 w-5 text-theme-secondary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
						/>
					</svg>
					<div>
						<div class="text-xs text-theme-muted">Current language</div>
						<div class="text-sm font-semibold text-theme">{currentLanguageName}</div>
					</div>
				</div>
			</div>

			<!-- Target Language Selection -->
			<div class="space-y-2">
				<label class="text-sm font-medium text-theme-secondary">Translate to</label>
				<select
					bind:value={selectedLanguage}
					disabled={isTranslating}
					class="w-full rounded-lg border border-theme bg-content px-4 py-2.5 text-theme focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
				>
					<option value="" disabled>Select a language...</option>
					{#each availableLanguages as language (language.code)}
						<option value={language.code}>{language.name}</option>
					{/each}
				</select>
			</div>

			<!-- Features -->
			<div class="space-y-2">
				<h4 class="text-sm font-medium text-theme-secondary">What will be translated:</h4>
				<ul class="space-y-1.5 text-sm text-theme-secondary">
					<li class="flex items-start gap-2">
						<svg class="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>Full transcript text</span>
					</li>
					<li class="flex items-start gap-2">
						<svg class="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>Memo title and introduction</span>
					</li>
					<li class="flex items-start gap-2">
						<svg class="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>All AI-generated memories</span>
					</li>
				</ul>
			</div>

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
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
							Translation will consume Mana credits
						</p>
						<p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
							The cost depends on the length of your content. The translation process may take
							several minutes for longer memos.
						</p>
					</div>
				</div>
			</div>

			<!-- Info -->
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
							Original content is preserved
						</p>
						<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
							Your original transcript and memories will not be deleted. You can access them by
							switching back to the original language.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<button onclick={onClose} disabled={isTranslating} class="btn-secondary">Cancel</button>
			<button
				onclick={handleTranslate}
				disabled={!selectedLanguage || isTranslating}
				class="btn-primary disabled:opacity-50"
			>
				{#if isTranslating}
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
					<span>Translating...</span>
				{:else}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
						/>
					</svg>
					<span>Start Translation</span>
				{/if}
			</button>
		</div>
	{/snippet}
</Modal>
