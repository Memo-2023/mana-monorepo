<script lang="ts">
	import type { HeaderModuleProps } from '../types';

	let {
		title = '',
		subtitle = '',
		avatar = '',
		avatarAlt = '',
		badge = '',
		icon = '',
		actions = []
	}: HeaderModuleProps = $props();
</script>

<div class="header-module flex items-start justify-between">
	<div class="flex items-center gap-4">
		{#if avatar}
			<img src={avatar} alt={avatarAlt || title} class="h-12 w-12 rounded-full object-cover" />
		{:else if icon}
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-theme-primary/10">
				<span class="text-2xl">{icon}</span>
			</div>
		{/if}

		<div>
			{#if title}
				<h3 class="text-lg font-semibold text-theme-text">
					{title}
					{#if badge}
						<span class="ml-2 rounded-full bg-theme-accent px-2 py-0.5 text-xs text-white">
							{badge}
						</span>
					{/if}
				</h3>
			{/if}

			{#if subtitle}
				<p class="text-sm text-theme-text-muted">{subtitle}</p>
			{/if}
		</div>
	</div>

	{#if actions.length > 0}
		<div class="flex gap-2">
			{#each actions as action}
				<button
					onclick={action.action}
					class="rounded-lg p-2 text-theme-text hover:bg-theme-surface-hover"
					title={action.label}
				>
					{#if action.icon}
						<span>{action.icon}</span>
					{:else}
						<span class="text-sm">{action.label}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
