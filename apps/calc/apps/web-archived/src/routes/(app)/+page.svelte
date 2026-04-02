<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Calculator,
		Flask,
		Code,
		Ruler,
		Coins,
		PiggyBank,
		Calendar,
		Percent,
	} from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let isLoading = $state(true);

	onMount(async () => {
		isLoading = false;
	});

	const quickLinks = [
		{
			href: '/standard',
			icon: Calculator,
			label: 'Standard',
			description: 'Grundrechenarten',
			color: 'bg-pink-500',
		},
		{
			href: '/scientific',
			icon: Flask,
			label: 'Wissenschaftlich',
			description: 'sin, cos, log & mehr',
			color: 'bg-violet-500',
		},
		{
			href: '/programmer',
			icon: Code,
			label: 'Programmierer',
			description: 'HEX, BIN, OCT',
			color: 'bg-cyan-500',
		},
		{
			href: '/converter',
			icon: Ruler,
			label: 'Einheiten',
			description: 'Umrechnen',
			color: 'bg-emerald-500',
		},
		{
			href: '/currency',
			icon: Coins,
			label: 'Währung',
			description: 'Wechselkurse',
			color: 'bg-amber-500',
		},
		{
			href: '/finance',
			icon: PiggyBank,
			label: 'Finanzen',
			description: 'Zins & Kredit',
			color: 'bg-blue-500',
		},
		{
			href: '/date',
			icon: Calendar,
			label: 'Datum',
			description: 'Tage berechnen',
			color: 'bg-orange-500',
		},
		{
			href: '/percentage',
			icon: Percent,
			label: 'Prozent & Trinkgeld',
			description: 'Aufteilen & Berechnen',
			color: 'bg-rose-500',
		},
	];
</script>

<svelte:head>
	<title>Calc - Dashboard</title>
</svelte:head>

{#if isLoading}
	<AppLoadingSkeleton />
{:else}
	<div class="dashboard">
		<header class="mb-8">
			<h1 class="text-2xl font-bold text-foreground">Calc</h1>
			<p class="text-muted-foreground text-sm mt-1">Dein Taschenrechner-Hub</p>
		</header>

		<!-- Quick display -->
		<div class="mb-8 p-6 rounded-xl bg-card border border-border">
			<div class="flex items-center gap-4">
				<div class="p-3 rounded-full bg-primary/10">
					<Calculator size={32} class="text-primary" />
				</div>
				<div>
					<div class="text-4xl font-bold text-foreground tabular-nums font-mono">0</div>
					<div class="text-muted-foreground text-sm">Wähle einen Rechner-Modus</div>
				</div>
			</div>
		</div>

		<!-- Quick Links Grid -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			{#each quickLinks as link}
				<a
					href={link.href}
					class="quick-link p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg group"
				>
					<div class="flex flex-col items-center text-center gap-3">
						<div
							class="{link.color} p-3 rounded-full text-white group-hover:scale-110 transition-transform"
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
{/if}

<style>
	.dashboard {
		max-width: 800px;
		margin: 0 auto;
	}
</style>
