<script lang="ts">
	import type { ManaApp, AppIconId } from '@manacore/shared-branding';

	interface Props {
		apps: ManaApp[];
		title: string;
		emptyText?: string;
		showPin?: boolean;
		onAppClick: (app: ManaApp) => void;
		onTogglePin?: (appId: string) => void;
		pinnedIds?: string[];
	}

	let {
		apps,
		title,
		emptyText,
		showPin = false,
		onAppClick,
		onTogglePin,
		pinnedIds = [],
	}: Props = $props();
</script>

{#if apps.length > 0}
	<section class="app-row-section">
		<h2 class="row-title">{title}</h2>
		<div class="row-scroll">
			{#each apps as app (app.id)}
				<button class="row-card" style="--app-color: {app.color};" onclick={() => onAppClick(app)}>
					<div class="row-card-icon">
						{#if app.icon}
							<img src={app.icon} alt={app.name} class="row-icon" />
						{:else}
							<span class="row-icon-letter" style="color: {app.color};">{app.name.charAt(0)}</span>
						{/if}
					</div>
					<span class="row-card-name">{app.name}</span>
					{#if showPin && onTogglePin}
						<button
							class="pin-btn"
							class:pinned={pinnedIds.includes(app.id)}
							onclick={(e) => {
								e.stopPropagation();
								onTogglePin(app.id);
							}}
							title={pinnedIds.includes(app.id)
								? 'Aus Favoriten entfernen'
								: 'Zu Favoriten hinzufügen'}
						>
							{pinnedIds.includes(app.id) ? '\u2605' : '\u2606'}
						</button>
					{/if}
				</button>
			{/each}
		</div>
	</section>
{:else if emptyText}
	<section class="app-row-section">
		<h2 class="row-title">{title}</h2>
		<p class="row-empty">{emptyText}</p>
	</section>
{/if}

<style>
	.app-row-section {
		margin-bottom: 1.5rem;
	}

	.row-title {
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		margin: 0 0 0.625rem;
	}

	.row-scroll {
		display: flex;
		gap: 0.625rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		scrollbar-width: none;
	}

	.row-scroll::-webkit-scrollbar {
		display: none;
	}

	.row-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--border, 0 0% 90%));
		background: hsl(var(--card, 0 0% 100%));
		cursor: pointer;
		transition: all 0.15s;
		min-width: 5.5rem;
		position: relative;
	}

	.row-card:hover {
		border-color: color-mix(in srgb, var(--app-color) 40%, hsl(var(--border, 0 0% 90%)));
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.row-card-icon {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.row-icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.row-icon-letter {
		font-weight: 700;
		font-size: 1rem;
	}

	.row-card-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--foreground, 0 0% 9%));
		white-space: nowrap;
	}

	.pin-btn {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.75rem;
		opacity: 0.3;
		transition: opacity 0.15s;
		padding: 0.125rem;
		line-height: 1;
	}

	.pin-btn:hover,
	.pin-btn.pinned {
		opacity: 1;
	}

	.pin-btn.pinned {
		color: #eab308;
	}

	.row-empty {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground, 0 0% 45%));
		margin: 0;
	}
</style>
