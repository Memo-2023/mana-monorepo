<script lang="ts">
	import { Palette, Check } from '@manacore/shared-icons';
	import { theme } from '$lib/stores/theme.svelte';
	import { THEME_DEFINITIONS, THEME_VARIANTS } from '@manacore/shared-theme';
	import type { ThemeVariant } from '@manacore/shared-theme';
</script>

<svelte:head>
	<title>Themes - Storage</title>
</svelte:head>

<div class="themes-page">
	<div class="page-header">
		<h1>
			<Palette size={24} />
			Themes
		</h1>
	</div>

	<div class="themes-grid">
		{#each THEME_VARIANTS as variant}
			{@const def = THEME_DEFINITIONS[variant]}
			<button
				class="theme-card"
				class:active={theme.variant === variant}
				onclick={() => theme.setVariant(variant)}
			>
				<div
					class="theme-preview"
					style="background: linear-gradient(135deg, hsl({def.light.primary}), hsl({def.light
						.secondary}))"
				>
					{#if theme.variant === variant}
						<div class="check-badge">
							<Check size={16} />
						</div>
					{/if}
				</div>
				<div class="theme-info">
					<span class="theme-name">{def.label}</span>
					<span class="theme-icon">{def.icon}</span>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.themes-page {
		min-height: 100%;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.themes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.theme-card {
		position: relative;
		padding: 0;
		background: rgb(var(--color-surface-elevated));
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-xl);
		overflow: hidden;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.theme-card:hover {
		border-color: rgb(var(--color-primary));
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.theme-card.active {
		border-color: rgb(var(--color-primary));
	}

	.theme-preview {
		position: relative;
		height: 100px;
	}

	.check-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: white;
		border-radius: 50%;
		color: rgb(var(--color-primary));
		box-shadow: var(--shadow-md);
	}

	.theme-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
	}

	.theme-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
	}

	.theme-icon {
		font-size: 1.25rem;
	}

	@media (max-width: 480px) {
		.themes-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
