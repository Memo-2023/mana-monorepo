<script lang="ts">
	import '../app.css';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="flex h-screen flex-col" style="background-color: var(--color-bg);">
	{@render children()}
</div>
