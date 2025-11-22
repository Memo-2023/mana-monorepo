<script lang="ts">
	interface Props {
		children: any;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div
	class="relative overflow-hidden rounded-3xl border border-theme bg-black/[0.02] dark:bg-white/[0.02] p-6 shadow-lg {className}"
>
	{@render children()}
</div>

<style>
	/* Additional glassmorphism effect */
	div {
		backdrop-filter: blur(10px);
	}
</style>
