<script lang="ts">
	import { Sparkle, PaperPlaneTilt, ArrowsClockwise, CaretDown } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { tokensStore } from '$lib/stores/tokens.svelte';
	import {
		availableModels,
		predefinedPrompts,
		generateText,
		getProviderForModel,
		type InsertionMode,
	} from '$lib/services/ai';
	import { estimateCostForPrompt } from '$lib/services/tokens';
	import { estimateTokens } from '$lib/utils/text';
	import type { AIModelOption, TokenCostEstimate } from '$lib/types';

	interface Props {
		documentContent: string;
		documentId?: string;
		onGenerated: (text: string, mode: InsertionMode) => void;
	}

	let { documentContent, documentId, onGenerated }: Props = $props();

	let prompt = $state('');
	let selectedModel = $state<string>('gpt-4.1');
	let isGenerating = $state(false);
	let error = $state('');
	let showPromptTemplates = $state(false);
	let showModelSelector = $state(false);
	let estimate = $state<TokenCostEstimate | null>(null);
	let estimateTimeout: ReturnType<typeof setTimeout> | null = null;

	let selectedModelLabel = $derived(
		availableModels.find((m) => m.value === selectedModel)?.label || selectedModel
	);

	// Debounced token estimation
	function updateEstimate() {
		if (estimateTimeout) clearTimeout(estimateTimeout);
		if (!prompt.trim()) {
			estimate = null;
			return;
		}
		estimateTimeout = setTimeout(async () => {
			const fullPrompt = prompt + (documentContent ? `\n\n${documentContent}` : '');
			estimate = await estimateCostForPrompt(fullPrompt, selectedModel);
		}, 500);
	}

	$effect(() => {
		prompt;
		selectedModel;
		updateEstimate();
	});

	function selectTemplate(template: (typeof predefinedPrompts)[0]) {
		prompt = template.prompt + documentContent;
		showPromptTemplates = false;
	}

	function selectModel(value: string) {
		selectedModel = value;
		showModelSelector = false;
	}

	async function generate(mode: InsertionMode) {
		if (!prompt.trim() || !authStore.user?.id) return;

		isGenerating = true;
		error = '';

		try {
			const provider = getProviderForModel(selectedModel);
			const result = await generateText(authStore.user.id, prompt, provider, {
				model: selectedModel,
				documentId,
			});

			tokensStore.updateBalance(result.tokenInfo.remainingTokens);
			onGenerated(result.text, mode);
			prompt = '';
			estimate = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Generierung fehlgeschlagen';
		} finally {
			isGenerating = false;
		}
	}
</script>

<div class="ai-toolbar border-t border-border bg-card/80 backdrop-blur-sm">
	<!-- Token balance -->
	<div class="flex items-center justify-between px-4 py-2 border-b border-border/50 text-xs">
		<div class="flex items-center gap-2 text-muted-foreground">
			<Sparkle size={14} class="text-primary" />
			<span
				>Token-Guthaben: <strong class="text-foreground"
					>{tokensStore.balance.toLocaleString()}</strong
				></span
			>
			{#if estimate}
				<span
					>→ <strong class="text-amber-500"
						>{Math.max(0, tokensStore.balance - estimate.appTokens).toLocaleString()}</strong
					></span
				>
				<span class="text-muted-foreground">({estimate.appTokens} Tokens)</span>
			{/if}
		</div>
		<a href="/tokens" class="text-primary hover:underline">Verwalten</a>
	</div>

	{#if error}
		<div
			class="px-4 py-2 text-xs text-destructive bg-destructive/10 border-b border-destructive/20"
		>
			{error}
		</div>
	{/if}

	<!-- Prompt templates -->
	{#if showPromptTemplates}
		<div class="px-4 py-3 border-b border-border/50">
			<div class="grid grid-cols-2 gap-2">
				{#each predefinedPrompts as template}
					<button
						class="text-left p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
						onclick={() => selectTemplate(template)}
					>
						<div class="font-medium text-foreground">{template.title}</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Input area -->
	<div class="p-3">
		<div class="flex gap-2">
			<div class="flex-1 relative">
				<textarea
					bind:value={prompt}
					placeholder="Prompt eingeben oder Vorlage wählen..."
					rows="2"
					class="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
					disabled={isGenerating}
				></textarea>
			</div>
		</div>

		<!-- Actions row -->
		<div class="flex items-center justify-between mt-2">
			<div class="flex items-center gap-2">
				<button
					class="text-xs px-2 py-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
					onclick={() => (showPromptTemplates = !showPromptTemplates)}
				>
					Vorlagen
				</button>

				<!-- Model selector -->
				<div class="relative">
					<button
						class="text-xs px-2 py-1 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
						onclick={() => (showModelSelector = !showModelSelector)}
					>
						{selectedModelLabel}
						<CaretDown size={12} />
					</button>
					{#if showModelSelector}
						<div
							class="absolute bottom-full left-0 mb-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[160px]"
						>
							{#each availableModels as model}
								<button
									class="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg {selectedModel ===
									model.value
										? 'bg-primary/10 text-primary'
										: ''}"
									onclick={() => selectModel(model.value)}
								>
									{model.label}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					class="btn btn-sm btn-secondary flex items-center gap-1 text-xs"
					onclick={() => generate('append')}
					disabled={!prompt.trim() || isGenerating}
				>
					{#if isGenerating}
						<ArrowsClockwise size={14} class="animate-spin" />
						Generiere...
					{:else}
						<PaperPlaneTilt size={14} />
						Anhängen
					{/if}
				</button>
				<button
					class="btn btn-sm btn-primary flex items-center gap-1 text-xs"
					onclick={() => generate('replace')}
					disabled={!prompt.trim() || isGenerating}
				>
					Ersetzen
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.ai-toolbar {
		position: sticky;
		bottom: 0;
		z-index: 10;
	}
</style>
