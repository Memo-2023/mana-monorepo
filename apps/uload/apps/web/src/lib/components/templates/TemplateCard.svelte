<script lang="ts">
	import type { Card } from '$lib/components/cards/types';
	import CardRenderer from '$lib/components/cards/CardRenderer.svelte';

	interface Props {
		template: Card;
		onUse?: (template: Card) => void;
		onPreview?: (template: Card) => void;
		onLike?: (template: Card) => void;
		onDuplicate?: (template: Card) => void;
		onShare?: (template: Card) => void;
		compact?: boolean;
	}

	let {
		template,
		onUse = () => {},
		onPreview = () => {},
		onLike = () => {},
		onDuplicate = () => {},
		onShare = () => {},
		compact = false
	}: Props = $props();
</script>

<div
	class="group relative overflow-hidden rounded-lg border border-theme-border bg-theme-surface transition-all hover:shadow-lg"
>
	<!-- Template Preview -->
	<div
		class="relative {compact
			? 'h-32'
			: 'h-48'} overflow-hidden bg-gradient-to-br from-theme-primary/10 to-theme-accent/10"
	>
		<div class="p-2 {compact ? 'scale-75' : ''}">
			<CardRenderer
				card={{
					id: template.id,
					config: template.config,
					metadata: template.metadata || {},
					constraints: template.constraints || {}
				}}
				editable={false}
			/>
		</div>

		<!-- Badges -->
		<div class="absolute top-2 left-2 flex gap-1">
			{#if template.is_featured}
				<span class="rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white">
					Featured
				</span>
			{/if}
		</div>

		<div class="absolute top-2 right-2">
			{#if template.category}
				<span
					class="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 capitalize backdrop-blur-sm"
				>
					{template.category}
				</span>
			{/if}
		</div>

		<!-- Hover Overlay -->
		<div
			class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
		>
			<button
				onclick={() => onPreview(template)}
				class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
			>
				Quick Preview
			</button>
		</div>
	</div>

	<!-- Template Info -->
	<div class="space-y-3 p-4">
		<div>
			<h3 class="font-semibold text-theme-text {compact ? 'text-sm' : 'text-base'}">
				{template.metadata?.name || 'Unnamed Template'}
			</h3>
			{#if template.metadata?.description && !compact}
				<p class="mt-1 line-clamp-2 text-sm text-theme-text-muted">
					{template.metadata.description}
				</p>
			{/if}
		</div>

		<!-- Tags -->
		{#if template.tags && template.tags.length > 0 && !compact}
			<div class="flex flex-wrap gap-1">
				{#each template.tags.slice(0, 3) as tag}
					<span class="rounded-full bg-theme-surface-hover px-2 py-0.5 text-xs text-theme-text">
						{tag}
					</span>
				{/each}
				{#if template.tags.length > 3}
					<span
						class="rounded-full bg-theme-surface-hover px-2 py-0.5 text-xs text-theme-text-muted"
					>
						+{template.tags.length - 3}
					</span>
				{/if}
			</div>
		{/if}

		<!-- Stats -->
		<div class="flex items-center justify-between text-xs text-theme-text-muted">
			<div class="flex items-center gap-3">
				<!-- Usage Count -->
				<span class="flex items-center gap-1" title="Times used">
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
						/>
					</svg>
					{template.usage_count || 0}
				</span>

				<!-- Likes -->
				<span class="flex items-center gap-1" title="Likes">
					<svg class="h-3.5 w-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
							clip-rule="evenodd"
						/>
					</svg>
					{template.likes_count || 0}
				</span>
			</div>

			<!-- Created Date -->
			{#if template.created && !compact}
				<span>{new Date(template.created).toLocaleDateString()}</span>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex gap-2 pt-2">
			{#if !compact}
				<button
					onclick={() => onPreview(template)}
					class="flex-1 rounded-lg bg-theme-surface-hover px-3 py-2 text-sm font-medium text-theme-text hover:bg-theme-border"
				>
					Preview
				</button>
			{/if}
			<button
				onclick={() => onUse(template)}
				class="{compact
					? 'flex-1'
					: 'flex-1'} rounded-lg bg-theme-primary px-3 py-2 text-sm font-medium text-white hover:bg-theme-primary/90"
			>
				Use Template
			</button>
		</div>

		<!-- Additional Actions -->
		{#if !compact}
			<div class="flex items-center justify-between border-t border-theme-border pt-2">
				<!-- Like Button -->
				<button
					onclick={() => onLike(template)}
					class="flex items-center gap-1 rounded p-1.5 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-red-500"
					title="Like this template"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<!-- Quick Actions -->
				<div class="flex gap-1">
					<button
						onclick={() => onDuplicate(template)}
						title="Add to my collection"
						class="rounded p-1.5 transition-colors hover:bg-theme-surface-hover"
					>
						<svg
							class="h-4 w-4 text-theme-text-muted"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"
							/>
						</svg>
					</button>
					<button
						onclick={() => onShare(template)}
						title="Share template"
						class="rounded p-1.5 transition-colors hover:bg-theme-surface-hover"
					>
						<svg
							class="h-4 w-4 text-theme-text-muted"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-4.516-3.95l-4.516 3.95a3 3 0 000 4.243l4.516 3.95a3 3 0 104.516-3.95l-4.516-3.95z"
							/>
						</svg>
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
