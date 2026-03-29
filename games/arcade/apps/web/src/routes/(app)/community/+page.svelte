<script lang="ts">
	import { _ } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$_('nav.community')} - Arcade</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">{$_('nav.community')}</h1>
		<p class="text-muted-foreground mt-1">
			Von der Community erstellte Spiele. Reiche dein eigenes Spiel ein!
		</p>
	</div>

	<div class="text-center py-12 rounded-xl border border-dashed border-border">
		<p class="text-4xl mb-4">🎮</p>
		<p class="text-muted-foreground">Noch keine Community-Spiele vorhanden.</p>
		<a
			href="/create"
			class="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
		>
			Erstelle das erste Spiel!
		</a>
	</div>
</div>
