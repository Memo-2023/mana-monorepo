<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Section title */
		title?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Additional CSS classes */
		class?: string;
		/** Content (SettingsCard components) */
		children: Snippet;
	}

	let { title, icon, class: className = '', children }: Props = $props();

	// Generate a slug from title for TOC navigation
	const sectionId =
		// svelte-ignore state_referenced_locally
		title
			?.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '') || '';
</script>

<section class="settings-section {className}" data-settings-section={sectionId}>
	{#if title}
		<header class="section-header-wrapper">
			<div class="section-header-pill">
				{#if icon}
					<span class="section-icon">
						{@render icon()}
					</span>
				{/if}
				<h2 class="section-title">
					{title}
				</h2>
			</div>
		</header>
	{/if}

	<div class="section-content">
		{@render children()}
	</div>
</section>

<style>
	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-header-wrapper {
		position: sticky;
		top: 70px;
		z-index: 20;
		padding: 0.5rem 0;
	}

	.section-header-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.9375rem;
		font-weight: 600;
		white-space: nowrap;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .section-header-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.section-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		color: hsl(var(--primary));
	}

	.section-icon :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}

	.section-title {
		margin: 0;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		letter-spacing: -0.01em;
	}

	.section-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.section-header-wrapper {
			top: 80px;
		}
	}
</style>
