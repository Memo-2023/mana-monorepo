<script lang="ts">
	interface Props {
		title: string;
		isFirst?: boolean;
		collapsible?: boolean;
		isCollapsed?: boolean;
		onPress?: () => void;
	}

	let {
		title,
		isFirst = false,
		collapsible = false,
		isCollapsed = false,
		onPress,
	}: Props = $props();

	function handleClick() {
		if (collapsible && onPress) {
			onPress();
		}
	}
</script>

{#if collapsible}
	<button
		onclick={handleClick}
		class="flex w-full items-center justify-between rounded-2xl border border-theme p-5 transition-colors bg-content-hover {isFirst
			? 'mt-2'
			: 'mt-4'} mb-3"
	>
		<h2 class="text-lg font-semibold">{title}</h2>
		<svg
			class="h-7 w-7 transition-transform {isCollapsed ? '' : 'rotate-180'}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
{:else}
	<h2 class="text-xl font-semibold {isFirst ? 'mt-2' : 'mt-8'} mb-4 px-1">{title}</h2>
{/if}
