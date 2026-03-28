<script lang="ts">
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="mb-4 text-6xl font-bold text-[hsl(var(--primary))]">{$page.status}</h1>
		<p class="mb-8 text-lg text-[hsl(var(--muted-foreground))]">
			{$page.error?.message || $_('error.notFound')}
		</p>
		<a
			href="/"
			class="rounded-lg bg-[hsl(var(--primary))] px-6 py-3 text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
		>
			{$_('error.backToHome')}
		</a>
	</div>
</div>
