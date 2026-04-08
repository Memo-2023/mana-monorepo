<!--
  QuickActionsList — shared shell for "list of clickable shortcut links" widgets.

  Both `dashboard/widgets/QuickActionsWidget` and `core/widgets/QuickActionsWidget`
  rendered the same shape: optional title (with emoji prefix) + a list of
  rounded-card links, each with an emoji/icon, a label and a description.
  They differed only in the data and a slightly different padding/icon size
  (the dashboard one is roomier; the core one is compact).

  This molecule takes the actions array directly. Consumers that need i18n
  resolve the keys before passing the data in.

  @example
  ```svelte
  <QuickActionsList
    title="Schnellzugriff"
    actions={[
      { href: '/todo', icon: '✅', label: 'Neue Aufgabe', description: 'Aufgabe erstellen' },
      ...
    ]}
    compact
  />
  ```
-->
<script lang="ts">
	export interface QuickAction {
		href: string;
		/** Emoji glyph or HTML entity (rendered with {@html}). Use a Phosphor icon snippet via the consumer's wrapper if you need a real component. */
		icon: string;
		label: string;
		description: string;
	}

	interface Props {
		actions: QuickAction[];
		/** Compact mode: smaller padding, smaller icon, smaller text. Used by core/widgets. */
		compact?: boolean;
		/** Optional heading rendered above the list. */
		title?: string;
		/** Optional emoji glyph rendered before the title. */
		titleIcon?: string;
	}

	let { actions, compact = false, title, titleIcon }: Props = $props();
</script>

<div>
	{#if title}
		<div class="mb-3">
			<h3 class="flex items-center gap-2 text-lg font-semibold">
				{#if titleIcon}<span>{@html titleIcon}</span>{/if}
				{title}
			</h3>
		</div>
	{/if}

	<div class={compact ? 'space-y-1' : 'space-y-2'}>
		{#each actions as action}
			<a
				href={action.href}
				class="flex items-center gap-3 rounded-lg transition-colors hover:bg-surface-hover {compact
					? 'p-2.5'
					: 'p-3'}"
			>
				<span class={compact ? 'text-xl' : 'text-2xl'}>{@html action.icon}</span>
				<div class="min-w-0">
					<p class="font-medium {compact ? 'text-sm' : ''}">{action.label}</p>
					<p class="text-muted-foreground {compact ? 'text-xs' : 'text-sm'}">
						{action.description}
					</p>
				</div>
			</a>
		{/each}
	</div>
</div>
