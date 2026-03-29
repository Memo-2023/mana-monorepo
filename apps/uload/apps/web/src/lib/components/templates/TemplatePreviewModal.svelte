<script lang="ts">
	import type { Card } from '$lib/components/cards/types';
	import { isBeginnerCard } from '$lib/components/cards/types';
	import CardRenderer from '$lib/components/cards/CardRenderer.svelte';

	interface Props {
		template: Card | null;
		show: boolean;
		onClose: () => void;
		onUse: (template: Card) => void;
		onDuplicate: (template: Card) => void;
		onLike?: (template: Card) => void;
	}

	let { template, show, onClose, onUse, onDuplicate, onLike = () => {} }: Props = $props();

	// Close modal on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

{#if show && template}
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
			class="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-theme-surface shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div
				class="sticky top-0 z-10 flex items-center justify-between border-b border-theme-border bg-theme-surface p-4"
			>
				<div>
					<h2 id="modal-title" class="text-xl font-bold text-theme-text">
						{template.metadata?.name || 'Template Preview'}
					</h2>
					{#if template.metadata?.description}
						<p class="text-sm text-theme-text-muted">{template.metadata.description}</p>
					{/if}
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
			<div class="space-y-6 p-6">
				<!-- Template Info Bar -->
				<div class="flex items-center justify-between rounded-lg bg-theme-background p-4">
					<div class="flex items-center gap-4">
						{#if template.category}
							<span class="rounded-full bg-theme-primary px-3 py-1 text-sm font-medium text-white">
								{template.category}
							</span>
						{/if}
						{#if template.is_featured}
							<span class="rounded-full bg-yellow-500 px-3 py-1 text-sm font-medium text-white">
								Featured
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-4 text-sm text-theme-text-muted">
						<span class="flex items-center gap-1">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
								/>
							</svg>
							{template.usage_count || 0} uses
						</span>
						<span class="flex items-center gap-1">
							<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
									clip-rule="evenodd"
								/>
							</svg>
							{template.likes_count || 0} likes
						</span>
					</div>
				</div>

				<!-- Live Preview -->
				<div>
					<h3 class="mb-3 font-semibold text-theme-text">Live Preview</h3>
					<div
						class="rounded-lg border-2 border-dashed border-theme-border bg-theme-background p-6"
					>
						<div class="flex justify-center">
							<div class="w-full max-w-md">
								<CardRenderer
									card={{
										id: template.id,
										config: template.config,
										metadata: template.metadata || {},
										constraints: template.constraints || {},
									}}
									editable={false}
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Template Details -->
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Configuration Info -->
					<div>
						<h3 class="mb-3 font-semibold text-theme-text">Configuration</h3>
						<div class="space-y-2 rounded-lg bg-theme-background p-4">
							<div class="flex justify-between">
								<span class="text-sm text-theme-text-muted">Mode:</span>
								<span class="text-sm capitalize text-theme-text"
									>{template.config?.mode || 'Unknown'}</span
								>
							</div>
							{#if isBeginnerCard(template.config)}
								<div class="flex justify-between">
									<span class="text-sm text-theme-text-muted">Modules:</span>
									<span class="text-sm text-theme-text">{template.config.modules.length}</span>
								</div>
							{/if}
							{#if template.variant}
								<div class="flex justify-between">
									<span class="text-sm text-theme-text-muted">Variant:</span>
									<span class="text-sm capitalize text-theme-text">{template.variant}</span>
								</div>
							{/if}
							{#if template.created}
								<div class="flex justify-between">
									<span class="text-sm text-theme-text-muted">Created:</span>
									<span class="text-sm text-theme-text"
										>{new Date(template.created).toLocaleDateString()}</span
									>
								</div>
							{/if}
						</div>
					</div>

					<!-- Stats -->
					<div>
						<h3 class="mb-3 font-semibold text-theme-text">Statistics</h3>
						<div class="grid grid-cols-2 gap-4">
							<div class="rounded-lg bg-theme-background p-4 text-center">
								<p class="text-2xl font-bold text-theme-text">{template.usage_count || 0}</p>
								<p class="text-sm text-theme-text-muted">Times Used</p>
							</div>
							<div class="rounded-lg bg-theme-background p-4 text-center">
								<p class="text-2xl font-bold text-theme-text">{template.likes_count || 0}</p>
								<p class="text-sm text-theme-text-muted">Likes</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Module Details -->
				{#if isBeginnerCard(template.config) && template.config.modules.length > 0}
					<div>
						<h3 class="mb-3 font-semibold text-theme-text">Included Modules</h3>
						<div class="grid gap-2 sm:grid-cols-2">
							{#each template.config.modules as module, index}
								<div
									class="flex items-center gap-3 rounded-lg border border-theme-border bg-theme-background p-3"
								>
									<span
										class="flex h-8 w-8 items-center justify-center rounded-full bg-theme-primary text-xs font-medium text-white"
									>
										{index + 1}
									</span>
									<div class="flex-1">
										<p class="font-medium capitalize text-theme-text">{module.type} Module</p>
										{#if module.props?.title}
											<p class="text-xs text-theme-text-muted">{module.props.title}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Tags -->
				{#if template.tags && template.tags.length > 0}
					<div>
						<h3 class="mb-2 font-semibold text-theme-text">Tags</h3>
						<div class="flex flex-wrap gap-2">
							{#each template.tags as tag}
								<span class="rounded-full bg-theme-surface-hover px-3 py-1 text-sm text-theme-text">
									{tag}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="sticky bottom-0 border-t border-theme-border bg-theme-surface p-4">
				<div class="flex gap-3">
					<button
						onclick={() => onLike(template)}
						class="flex items-center gap-2 rounded-lg bg-theme-surface-hover px-4 py-2 font-medium text-theme-text transition-colors hover:bg-theme-border"
					>
						<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
								clip-rule="evenodd"
							/>
						</svg>
						Like
					</button>
					<button
						onclick={() => {
							onDuplicate(template);
							onClose();
						}}
						class="flex-1 rounded-lg bg-theme-surface-hover px-4 py-2 font-medium text-theme-text transition-colors hover:bg-theme-border"
					>
						Add to Collection
					</button>
					<button
						onclick={() => {
							onUse(template);
							onClose();
						}}
						class="hover:bg-theme-primary/90 flex-1 rounded-lg bg-theme-primary px-4 py-2 font-medium text-white transition-colors"
					>
						Use This Template
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
