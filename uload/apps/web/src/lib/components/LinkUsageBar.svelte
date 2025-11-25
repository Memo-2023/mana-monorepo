<script lang="ts">
	import { getLimitDisplayInfo } from '$lib/services/link-limits';
	import { Check, AlertTriangle, X } from 'lucide-svelte';

	let { user } = $props();

	let usageInfo = $derived(getLimitDisplayInfo(user));
	
	let barColor = $derived(() => {
		switch (usageInfo.status) {
			case 'danger': return 'bg-red-500';
			case 'warning': return 'bg-yellow-500';
			default: return 'bg-blue-500';
		}
	});

	let textColor = $derived(() => {
		switch (usageInfo.status) {
			case 'danger': return 'text-red-700';
			case 'warning': return 'text-yellow-700';
			default: return 'text-blue-700';
		}
	});

	let icon = $derived(() => {
		switch (usageInfo.status) {
			case 'danger': return X;
			case 'warning': return AlertTriangle;
			default: return Check;
		}
	});
</script>

<div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
	<div class="flex items-center justify-between mb-2">
		<div class="flex items-center gap-2">
			<svelte:component this={icon} class="h-4 w-4 {textColor}" />
			<span class="text-sm font-medium text-gray-900 dark:text-white">
				{#if usageInfo.unlimited}
					Unbegrenzte Links
				{:else}
					Link-Nutzung diesen Monat
				{/if}
			</span>
		</div>
		{#if !usageInfo.unlimited}
			<span class="text-sm {textColor}">
				{usageInfo.current} / {usageInfo.limit}
			</span>
		{/if}
	</div>

	{#if !usageInfo.unlimited}
		<!-- Progress Bar -->
		<div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
			<div 
				class="h-2 rounded-full transition-all duration-300 {barColor}" 
				style="width: {Math.min(usageInfo.percentage, 100)}%"
			></div>
		</div>

		<!-- Status Messages -->
		<div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
			{#if usageInfo.status === 'danger'}
				<span class="text-red-600 dark:text-red-400 font-medium">
					Monatslimit erreicht! Upgrade für mehr Links.
				</span>
			{:else if usageInfo.status === 'warning'}
				<span class="text-yellow-600 dark:text-yellow-400 font-medium">
					{usageInfo.limit - usageInfo.current} Links verbleibend
				</span>
			{:else}
				<span class="text-green-600 dark:text-green-400">
					{usageInfo.limit - usageInfo.current} Links verbleibend
				</span>
			{/if}
		</div>
	{:else}
		<div class="text-xs text-green-600 dark:text-green-400 font-medium">
			🎉 Du hast unbegrenzten Zugang zu allen Features!
		</div>
	{/if}
</div>