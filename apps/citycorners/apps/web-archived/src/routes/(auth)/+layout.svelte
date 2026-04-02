<script lang="ts">
	import { _ } from 'svelte-i18n';
	import '$lib/i18n';

	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-foreground">{$_('app.name')}</h1>
			<p class="text-foreground-secondary mt-2">{$_('app.tagline')}</p>
		</div>
		{@render children()}
	</div>
</div>
