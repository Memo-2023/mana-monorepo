<script lang="ts">
	interface Props {
		users: string[];
	}

	let { users }: Props = $props();

	let text = $derived(() => {
		if (users.length === 0) return '';
		if (users.length === 1) return `${users[0]} tippt...`;
		if (users.length === 2) return `${users[0]} und ${users[1]} tippen...`;
		return `${users[0]} und ${users.length - 1} weitere tippen...`;
	});
</script>

{#if users.length > 0}
	<div class="flex items-center gap-2 px-4 py-2 text-sm text-base-content/60">
		<!-- Animated dots -->
		<span class="flex gap-1">
			<span class="h-2 w-2 animate-bounce rounded-full bg-base-content/40 [animation-delay:0ms]"
			></span>
			<span class="h-2 w-2 animate-bounce rounded-full bg-base-content/40 [animation-delay:150ms]"
			></span>
			<span class="h-2 w-2 animate-bounce rounded-full bg-base-content/40 [animation-delay:300ms]"
			></span>
		</span>
		<span>{text()}</span>
	</div>
{/if}
