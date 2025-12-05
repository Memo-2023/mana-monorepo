<script lang="ts">
	import { MANA_APPS, APP_URLS } from '@manacore/shared-branding';
</script>

<div class="mx-auto max-w-4xl">
	<h1 class="mb-6 text-2xl font-bold text-foreground">Alle Apps</h1>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each MANA_APPS.filter((app) => !app.comingSoon) as app}
			<a
				href={APP_URLS[app.id]?.dev || '#'}
				class="card flex items-center gap-4 transition-all hover:border-primary/50"
				style="border-left: 4px solid {app.color}"
			>
				<img src={app.icon} alt={app.name} class="h-12 w-12 rounded-lg" />
				<div>
					<h3 class="font-semibold">{app.name}</h3>
					<p class="text-sm text-muted-foreground">{app.description.de}</p>
				</div>
			</a>
		{/each}
	</div>
</div>
