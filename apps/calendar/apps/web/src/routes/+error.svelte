<script lang="ts">
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<h1 class="text-6xl font-bold text-blue-600 mb-4">{$page.status}</h1>
	<p class="text-xl text-muted-foreground mb-8">{$page.error?.message || $_('error.notFound')}</p>
	<a href="/" class="btn btn-primary">{$_('error.backToHome')}</a>
</div>
