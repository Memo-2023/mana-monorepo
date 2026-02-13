<script lang="ts">
	// Apps overview step - shows available Mana apps

	const APPS = [
		{
			id: 'todo',
			name: 'Todo',
			description: 'Aufgaben verwalten mit Projekten und Prioritäten',
			icon: '✓',
			color: 'bg-blue-500',
			category: 'Produktivität',
		},
		{
			id: 'calendar',
			name: 'Calendar',
			description: 'Termine und Ereignisse planen',
			icon: '📅',
			color: 'bg-green-500',
			category: 'Produktivität',
		},
		{
			id: 'contacts',
			name: 'Contacts',
			description: 'Kontakte organisieren und verwalten',
			icon: '👤',
			color: 'bg-purple-500',
			category: 'Produktivität',
		},
		{
			id: 'chat',
			name: 'Chat',
			description: 'KI-gestützte Konversationen',
			icon: '💬',
			color: 'bg-pink-500',
			category: 'AI',
		},
		{
			id: 'picture',
			name: 'Picture',
			description: 'Bilder mit KI generieren',
			icon: '🎨',
			color: 'bg-orange-500',
			category: 'AI',
		},
		{
			id: 'zitare',
			name: 'Zitare',
			description: 'Tägliche Inspiration mit Zitaten',
			icon: '💡',
			color: 'bg-yellow-500',
			category: 'Lifestyle',
		},
		{
			id: 'clock',
			name: 'Clock',
			description: 'Timer, Stoppuhr und Weltuhr',
			icon: '⏰',
			color: 'bg-red-500',
			category: 'Utility',
		},
		{
			id: 'manadeck',
			name: 'ManaDeck',
			description: 'Karteikarten für effektives Lernen',
			icon: '📚',
			color: 'bg-indigo-500',
			category: 'Bildung',
		},
	];

	const categories = [...new Set(APPS.map((app) => app.category))];
</script>

<div class="max-w-2xl mx-auto">
	<div class="text-center mb-8">
		<h2 class="text-2xl font-bold mb-2">Entdecke die Mana-Apps</h2>
		<p class="text-muted-foreground">Alle Apps sind mit deinem ManaCore-Konto verbunden.</p>
	</div>

	{#each categories as category}
		<div class="mb-6">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each APPS.filter((a) => a.category === category) as app}
					<div
						class="p-4 rounded-xl bg-card border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group"
					>
						<div class="flex items-start gap-3">
							<div
								class="{app.color} h-10 w-10 rounded-lg flex items-center justify-center text-white text-lg"
							>
								{app.icon}
							</div>
							<div class="flex-1 min-w-0">
								<h4 class="font-semibold group-hover:text-primary transition-colors">{app.name}</h4>
								<p class="text-sm text-muted-foreground line-clamp-2">{app.description}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}

	<div class="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
		<div class="flex gap-3">
			<div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
				<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div>
				<h4 class="font-medium">Ein Konto, alle Apps</h4>
				<p class="text-sm text-muted-foreground">
					Dein ManaCore-Login funktioniert in allen Apps. Deine Credits werden geteilt.
				</p>
			</div>
		</div>
	</div>
</div>
