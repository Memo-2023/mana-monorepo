<script lang="ts">
	import { Cards, Books, ChartBar, MagnifyingGlass } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	const quickLinks = [
		{
			href: '/cards/decks',
			icon: Books,
			label: 'Meine Decks',
			description: 'Alle Kartendecks',
			color: 'bg-indigo-500',
		},
		{
			href: '/cards/explore',
			icon: MagnifyingGlass,
			label: 'Entdecken',
			description: 'Offentliche Decks',
			color: 'bg-green-500',
		},
		{
			href: '/cards/progress',
			icon: ChartBar,
			label: 'Fortschritt',
			description: 'Lernstatistiken',
			color: 'bg-amber-500',
		},
	];
</script>

<svelte:head>
	<title>Cards - Mana</title>
</svelte:head>

<RoutePage appId="cards">
	<div class="mx-auto max-w-3xl">
		<header class="mb-8">
			<h1 class="text-2xl font-bold text-foreground">Cards</h1>
			<p class="text-muted-foreground mt-1 text-sm">Karteikarten & Spaced Repetition</p>
		</header>

		<!-- Cards Icon -->
		<div class="mb-8 rounded-xl border border-border bg-card p-6">
			<div class="flex items-center gap-4">
				<div class="rounded-full bg-indigo-500/10 p-3">
					<Cards size={32} class="text-indigo-500" />
				</div>
				<div>
					<div class="text-xl font-bold text-foreground">Lerne effizienter</div>
					<div class="text-muted-foreground text-sm">
						Karteikarten erstellen, organisieren und mit Spaced Repetition lernen
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Links Grid -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each quickLinks as link}
				<a
					href={link.href}
					class="rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-lg group"
				>
					<div class="flex flex-col items-center gap-3 text-center">
						<div
							class="{link.color} rounded-full p-3 text-white transition-transform group-hover:scale-110"
						>
							<link.icon size={24} />
						</div>
						<div>
							<div class="font-medium text-foreground">{link.label}</div>
							<div class="text-xs text-muted-foreground">{link.description}</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</RoutePage>
