<script lang="ts">
	import { getHealth } from '$lib/api/llm';
	import { onMount } from 'svelte';

	let healthStatus = $state<'loading' | 'healthy' | 'error'>('loading');
	let healthDetails = $state<string>('');

	async function checkHealth() {
		try {
			const health = await getHealth();
			healthStatus = health.status === 'healthy' ? 'healthy' : 'error';
			healthDetails = health.version ? `v${health.version}` : '';
		} catch {
			healthStatus = 'error';
			healthDetails = 'Connection failed';
		}
	}

	onMount(() => {
		checkHealth();
		const interval = setInterval(checkHealth, 30000);
		return () => clearInterval(interval);
	});
</script>

<header
	class="flex h-14 items-center justify-between border-b px-4"
	style="border-color: var(--color-border); background-color: var(--color-surface);"
>
	<div class="flex items-center gap-3">
		<svg class="h-8 w-8" viewBox="0 0 32 32" fill="none">
			<rect width="32" height="32" rx="8" fill="var(--color-primary)" />
			<path d="M8 16l4-8 4 8-4 8-4-8z" fill="white" opacity="0.9" />
			<path d="M16 16l4-8 4 8-4 8-4-8z" fill="white" opacity="0.7" />
		</svg>
		<div>
			<h1 class="text-lg font-semibold">LLM Playground</h1>
			<p class="text-xs" style="color: var(--color-text-muted);">mana-llm Service</p>
		</div>
	</div>

	<div class="flex items-center gap-2">
		<div
			class="flex items-center gap-2 rounded-full px-3 py-1 text-sm"
			style="background-color: var(--color-bg);"
		>
			{#if healthStatus === 'loading'}
				<div
					class="h-2 w-2 animate-pulse rounded-full"
					style="background-color: var(--color-warning);"
				></div>
				<span style="color: var(--color-text-muted);">Checking...</span>
			{:else if healthStatus === 'healthy'}
				<div class="h-2 w-2 rounded-full" style="background-color: var(--color-success);"></div>
				<span style="color: var(--color-success);">Healthy</span>
				{#if healthDetails}
					<span style="color: var(--color-text-muted);">({healthDetails})</span>
				{/if}
			{:else}
				<div class="h-2 w-2 rounded-full" style="background-color: var(--color-error);"></div>
				<span style="color: var(--color-error);">Offline</span>
			{/if}
		</div>
		<button
			onclick={checkHealth}
			class="rounded p-1.5 transition-colors hover:bg-white/10"
			title="Refresh health status"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
		</button>
	</div>
</header>
