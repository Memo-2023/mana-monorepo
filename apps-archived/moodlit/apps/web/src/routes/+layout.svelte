<script lang="ts">
	import '../app.css';
	import '$lib/i18n';

	let { children } = $props();
</script>

<div class="min-h-screen bg-[hsl(var(--color-background))] text-[hsl(var(--color-foreground))]">
	{@render children()}
</div>
