<script lang="ts">
	import { goto } from '$app/navigation';
	import { Lamp, MusicNotes, Palette } from '@mana/shared-icons';

	const quickLinks = [
		{
			href: '/moodlit/moods',
			icon: Lamp,
			label: 'Moods',
			description: 'Stimmungslichter',
			color: 'bg-purple-500',
		},
		{
			href: '/moodlit/sequences',
			icon: MusicNotes,
			label: 'Sequences',
			description: 'Mood-Abfolgen',
			color: 'bg-indigo-500',
		},
	];
</script>

<svelte:head>
	<title>Moodlit - Mana</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<header class="mb-8">
		<h1 class="text-2xl font-bold text-foreground">Moodlit</h1>
		<p class="text-muted-foreground mt-1 text-sm">Ambient Lighting & Mood App</p>
	</header>

	<!-- Hero display -->
	<div class="mb-8 overflow-hidden rounded-xl border border-border bg-card p-6">
		<div class="flex items-center gap-4">
			<div class="rounded-full bg-purple-500/10 p-3">
				<Palette size={32} class="text-purple-500" />
			</div>
			<div>
				<div class="text-2xl font-bold text-foreground">Stimmungslicht</div>
				<div class="text-muted-foreground text-sm">Wahle ein Mood oder erstelle dein eigenes</div>
			</div>
		</div>
	</div>

	<!-- Quick Links Grid -->
	<div class="grid grid-cols-2 gap-4">
		{#each quickLinks as link}
			<a
				href={link.href}
				class="rounded-xl border border-border bg-card p-6 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-lg group"
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
