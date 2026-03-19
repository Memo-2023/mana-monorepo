<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<h1 class="text-6xl font-bold text-purple-600 mb-4">{$page.status}</h1>
	<p class="text-xl text-muted-foreground mb-8">{$page.error?.message || 'Seite nicht gefunden'}</p>
	<a href="/" class="btn btn-primary">Zurück zur Startseite</a>
</div>
