<script lang="ts">
	import {
		Keyboard,
		ArrowBendDownLeft,
		ArrowsVertical,
		X,
		Mouse,
		Sparkle,
		ChatCircle,
		NavigationArrow,
	} from '@mana/shared-icons';
	import type { ShortcutCategory } from './types';

	interface Props {
		/** Shortcut categories to display */
		categories: ShortcutCategory[];
		/** Compact mode for smaller displays */
		compact?: boolean;
	}

	let { categories, compact = false }: Props = $props();

	// Default icons for common categories
	const categoryIcons: Record<string, typeof Keyboard> = {
		inputbar: Keyboard,
		dialogs: ChatCircle,
		navigation: NavigationArrow,
	};

	// Default icons for common shortcuts based on first key
	const shortcutIcons: Record<string, typeof Keyboard> = {
		Enter: ArrowBendDownLeft,
		Cmd: Sparkle,
		Ctrl: Sparkle,
		Esc: X,
		'↑': ArrowsVertical,
		'↓': ArrowsVertical,
		Rechtsklick: Mouse,
	};

	function getShortcutIcon(keys: string[]) {
		for (const key of keys) {
			if (shortcutIcons[key]) {
				return shortcutIcons[key];
			}
		}
		return Keyboard;
	}

	function getCategoryIcon(category: ShortcutCategory) {
		if (category.icon) return category.icon;
		return categoryIcons[category.id] || Keyboard;
	}
</script>

<div class="shortcuts-panel" class:compact>
	{#each categories as category}
		{@const CategoryIcon = getCategoryIcon(category)}
		<div class="category">
			<div class="category-header">
				<CategoryIcon size={16} weight="bold" />
				<span>{category.title}</span>
			</div>

			<div class="shortcuts-list">
				{#each category.shortcuts as shortcut}
					{@const ShortcutIcon = getShortcutIcon(shortcut.keys)}
					<div class="shortcut-item">
						<div class="shortcut-icon">
							<ShortcutIcon size={18} weight="bold" />
						</div>
						<div class="shortcut-keys">
							{#each shortcut.keys as key, i}
								{#if i > 0}<span class="key-separator">+</span>{/if}
								<kbd>{key}</kbd>
							{/each}
							{#if shortcut.altKeys && !compact}
								<span class="alt-keys">
									oder
									{#each shortcut.altKeys as key, i}
										{#if i > 0}<span class="key-separator">+</span>{/if}
										<kbd>{key}</kbd>
									{/each}
								</span>
							{/if}
						</div>
						<span class="shortcut-desc">{shortcut.description}</span>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.shortcuts-panel {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.category {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.shortcuts-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.shortcut-item {
		display: grid;
		grid-template-columns: 36px 1fr 1fr;
		gap: 0.75rem;
		align-items: center;
		padding: 0.625rem 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
		transition: background 0.15s ease;
	}

	.shortcut-item:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.shortcut-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		border-radius: var(--radius-sm);
	}

	.shortcut-keys {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.shortcut-keys kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		height: 28px;
		padding: 0 0.5rem;
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: inherit;
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		border-radius: 6px;
		box-shadow:
			0 1px 0 1px hsl(var(--color-border)),
			0 2px 0 hsl(var(--color-muted));
	}

	.key-separator {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0.1875rem;
	}

	.alt-keys {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.shortcut-desc {
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
	}

	/* Compact mode */
	.shortcuts-panel.compact .shortcut-item {
		grid-template-columns: 24px 1fr;
		grid-template-rows: auto auto;
		padding: 0.375rem 0.5rem;
	}

	.shortcuts-panel.compact .shortcut-icon {
		grid-row: span 2;
		width: 24px;
		height: 24px;
	}

	.shortcuts-panel.compact .shortcut-keys {
		grid-column: 2;
	}

	.shortcuts-panel.compact .shortcut-desc {
		grid-column: 2;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.shortcuts-panel.compact .alt-keys {
		display: none;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.shortcut-item {
			grid-template-columns: 24px 1fr;
			grid-template-rows: auto auto;
		}

		.shortcut-icon {
			grid-row: span 2;
			width: 24px;
			height: 24px;
		}

		.shortcut-keys {
			grid-column: 2;
		}

		.shortcut-desc {
			grid-column: 2;
			font-size: 0.6875rem;
			color: hsl(var(--color-muted-foreground));
		}

		.alt-keys {
			display: none;
		}
	}
</style>
