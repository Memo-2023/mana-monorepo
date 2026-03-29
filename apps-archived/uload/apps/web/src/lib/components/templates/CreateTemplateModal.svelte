<script lang="ts">
	import { unifiedCardService } from '$lib/services/unifiedCardService';
	import type { Card } from '$lib/components/cards/types';
	import { isBeginnerCard } from '$lib/components/cards/types';
	import CardRenderer from '$lib/components/cards/CardRenderer.svelte';

	interface Props {
		card: Card | null;
		show: boolean;
		onClose: () => void;
		onSuccess: (template: Card) => void;
	}

	let { card, show, onClose, onSuccess }: Props = $props();

	// Form state
	let templateName = $state('');
	let templateDescription = $state('');
	let templateCategory = $state('');
	let templateTags = $state('');
	let templateVisibility = $state<'public' | 'unlisted'>('public');
	let allowDuplication = $state(true);
	let loading = $state(false);
	let error = $state('');

	// Available categories
	const categories = [
		{ value: '', label: 'Select Category' },
		{ value: 'personal', label: 'Personal' },
		{ value: 'creative', label: 'Creative' },
		{ value: 'minimal', label: 'Minimal' },
		{ value: 'social', label: 'Social' },
		{ value: 'portfolio', label: 'Portfolio' },
		{ value: 'other', label: 'Other' },
	];

	// Reset form when card changes
	$effect(() => {
		if (card) {
			templateName = card.metadata?.name ? `${card.metadata.name} Template` : '';
			templateDescription = card.metadata?.description || '';
			templateCategory = '';
			templateTags = '';
			templateVisibility = 'public';
			allowDuplication = true;
			error = '';
		}
	});

	// Handle form submission
	async function handleSubmit() {
		if (!card) return;

		// Validation
		if (!templateName.trim()) {
			error = 'Template name is required';
			return;
		}

		if (!templateCategory) {
			error = 'Please select a category';
			return;
		}

		loading = true;
		error = '';

		try {
			const tags = templateTags
				.split(',')
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0);

			const template = await unifiedCardService.createTemplate(card.id!, {
				name: templateName.trim(),
				description: templateDescription.trim() || undefined,
				category: templateCategory,
				tags: tags.length > 0 ? tags : undefined,
				visibility: templateVisibility,
				allow_duplication: allowDuplication,
			});

			if (template) {
				onSuccess(template);
				onClose();
			} else {
				error = 'Failed to create template. Please try again.';
			}
		} catch (err) {
			console.error('Error creating template:', err);
			error = 'An error occurred while creating the template.';
		} finally {
			loading = false;
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Close modal on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if show && card}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-theme-surface shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-theme-border p-4">
				<div>
					<h2 id="modal-title" class="text-xl font-bold text-theme-text">Create Template</h2>
					<p class="text-sm text-theme-text-muted">Share your card design with the community</p>
				</div>
				<button
					onclick={onClose}
					class="rounded-lg p-2 transition-colors hover:bg-theme-surface-hover"
					aria-label="Close modal"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Form -->
					<div class="space-y-4">
						<!-- Template Name -->
						<div>
							<label for="template-name" class="mb-1 block text-sm font-medium text-theme-text">
								Template Name *
							</label>
							<input
								id="template-name"
								type="text"
								bind:value={templateName}
								placeholder="Enter a descriptive name"
								class="w-full rounded-lg border border-theme-border bg-theme-background px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
								required
							/>
						</div>

						<!-- Description -->
						<div>
							<label
								for="template-description"
								class="mb-1 block text-sm font-medium text-theme-text"
							>
								Description
							</label>
							<textarea
								id="template-description"
								bind:value={templateDescription}
								placeholder="Describe what makes this template special"
								rows="3"
								class="w-full resize-none rounded-lg border border-theme-border bg-theme-background px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
							></textarea>
						</div>

						<!-- Category -->
						<div>
							<label for="template-category" class="mb-1 block text-sm font-medium text-theme-text">
								Category *
							</label>
							<select
								id="template-category"
								bind:value={templateCategory}
								class="w-full rounded-lg border border-theme-border bg-theme-background px-3 py-2 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
								required
							>
								{#each categories as category}
									<option value={category.value}>{category.label}</option>
								{/each}
							</select>
						</div>

						<!-- Tags -->
						<div>
							<label for="template-tags" class="mb-1 block text-sm font-medium text-theme-text">
								Tags
							</label>
							<input
								id="template-tags"
								type="text"
								bind:value={templateTags}
								placeholder="minimal, professional, clean (comma separated)"
								class="w-full rounded-lg border border-theme-border bg-theme-background px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
							/>
							<p class="mt-1 text-xs text-theme-text-muted">
								Separate tags with commas. Help others find your template!
							</p>
						</div>

						<!-- Visibility -->
						<div>
							<label class="mb-1 block text-sm font-medium text-theme-text"> Visibility </label>
							<div class="space-y-2">
								<label class="flex items-center">
									<input type="radio" bind:group={templateVisibility} value="public" class="mr-2" />
									<span class="text-sm text-theme-text">Public - Anyone can find and use</span>
								</label>
								<label class="flex items-center">
									<input
										type="radio"
										bind:group={templateVisibility}
										value="unlisted"
										class="mr-2"
									/>
									<span class="text-sm text-theme-text"
										>Unlisted - Only accessible via direct link</span
									>
								</label>
							</div>
						</div>

						<!-- Allow Duplication -->
						<div>
							<label class="flex items-center">
								<input type="checkbox" bind:checked={allowDuplication} class="mr-2" />
								<span class="text-sm text-theme-text">Allow others to duplicate this template</span>
							</label>
						</div>

						<!-- Error Message -->
						{#if error}
							<div class="rounded-lg border border-red-200 bg-red-50 p-3">
								<p class="text-sm text-red-700">{error}</p>
							</div>
						{/if}
					</div>

					<!-- Preview -->
					<div>
						<h3 class="mb-3 text-sm font-medium text-theme-text">Preview</h3>
						<div class="rounded-lg border border-theme-border bg-theme-background p-4">
							<CardRenderer
								card={{
									id: card.id,
									config: card.config,
									metadata: card.metadata || {},
									constraints: card.constraints || {},
								}}
								readonly={true}
								compact={true}
							/>
						</div>

						<!-- Template Info -->
						<div class="mt-4 space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-theme-text-muted">Mode:</span>
								<span class="capitalize text-theme-text">{card.config?.mode || 'Unknown'}</span>
							</div>
							{#if isBeginnerCard(card.config)}
								<div class="flex justify-between">
									<span class="text-theme-text-muted">Modules:</span>
									<span class="text-theme-text">{card.config.modules.length}</span>
								</div>
							{/if}
							{#if card.variant}
								<div class="flex justify-between">
									<span class="text-theme-text-muted">Variant:</span>
									<span class="capitalize text-theme-text">{card.variant}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="border-t border-theme-border p-4">
				<div class="flex justify-end gap-3">
					<button
						onclick={onClose}
						class="rounded-lg px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
						disabled={loading}
					>
						Cancel
					</button>
					<button
						onclick={handleSubmit}
						class="hover:bg-theme-primary/90 flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
						disabled={loading || !templateName.trim() || !templateCategory}
					>
						{#if loading}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
						{/if}
						{loading ? 'Creating...' : 'Create Template'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
