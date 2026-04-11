<!--
  SettingsSectionHeader — icon-circle + title + description, with an optional
  right-aligned `action` snippet (e.g. an "Alle Details"-Link).
-->
<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	type Tone = 'primary' | 'blue' | 'yellow' | 'purple' | 'indigo' | 'red';

	interface Props {
		icon: Component;
		title: string;
		description?: string;
		tone?: Tone;
		action?: Snippet;
	}

	let { icon: Icon, title, description, tone = 'primary', action }: Props = $props();

	const toneClasses: Record<Tone, string> = {
		primary: 'bg-primary/10 text-primary',
		blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
		yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
		purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
		indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
		red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
	};
</script>

<div class="mb-6 flex items-center justify-between gap-3">
	<div class="flex min-w-0 items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full {toneClasses[tone]}"
		>
			<Icon size={20} />
		</div>
		<div class="min-w-0">
			<h2 class="truncate text-lg font-semibold">{title}</h2>
			{#if description}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
		</div>
	</div>
	{#if action}
		<div class="shrink-0">{@render action()}</div>
	{/if}
</div>
