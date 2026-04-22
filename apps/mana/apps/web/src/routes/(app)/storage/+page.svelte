<script lang="ts">
	import {
		Folder,
		Heart,
		MagnifyingGlass,
		Trash,
		HardDrives,
		FolderPlus,
	} from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	const quickLinks = [
		{
			href: '/storage/files',
			icon: Folder,
			label: 'Meine Dateien',
			description: 'Dateien & Ordner',
			color: 'bg-blue-500',
		},
		{
			href: '/storage/favorites',
			icon: Heart,
			label: 'Favoriten',
			description: 'Markierte Dateien',
			color: 'bg-red-500',
		},
		{
			href: '/storage/search',
			icon: MagnifyingGlass,
			label: 'Suche',
			description: 'Dateien finden',
			color: 'bg-green-500',
		},
		{
			href: '/storage/trash',
			icon: Trash,
			label: 'Papierkorb',
			description: 'Geloschte Dateien',
			color: 'bg-amber-500',
		},
	];
</script>

<svelte:head>
	<title>Storage - Mana</title>
</svelte:head>

<RoutePage appId="storage">
	<div class="mx-auto max-w-3xl">
		<header class="mb-8">
			<h1 class="text-2xl font-bold text-foreground">Storage</h1>
			<p class="text-muted-foreground mt-1 text-sm">Dein Cloud-Speicher</p>
		</header>

		<!-- Storage Icon -->
		<div class="mb-8 rounded-xl border border-border bg-card p-6">
			<div class="flex items-center gap-4">
				<div class="rounded-full bg-primary/10 p-3">
					<HardDrives size={32} class="text-primary" />
				</div>
				<div>
					<div class="text-xl font-bold text-foreground">Cloud-Dateiverwaltung</div>
					<div class="text-muted-foreground text-sm">
						Dateien hochladen, organisieren und teilen
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Links Grid -->
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
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
