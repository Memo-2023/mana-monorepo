<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Clock, Bell, Timer, Hourglass, Globe } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let isLoading = $state(true);

	onMount(async () => {
		// No auth redirect - guest mode allowed
		isLoading = false;
	});

	const quickLinks = [
		{
			href: '/world-clock',
			icon: Globe,
			label: 'Weltzeituhr',
			description: 'Zeitzonen im Blick',
			color: 'bg-blue-500',
		},
		{
			href: '/alarms',
			icon: Bell,
			label: 'Wecker',
			description: 'Alarme verwalten',
			color: 'bg-amber-500',
		},
		{
			href: '/timers',
			icon: Timer,
			label: 'Timer',
			description: 'Countdowns starten',
			color: 'bg-green-500',
		},
		{
			href: '/stopwatch',
			icon: Hourglass,
			label: 'Stoppuhr',
			description: 'Zeit messen',
			color: 'bg-purple-500',
		},
	];
</script>

<svelte:head>
	<title>Clock - Dashboard</title>
</svelte:head>

{#if isLoading}
	<AppLoadingSkeleton />
{:else}
	<div class="dashboard">
		<header class="mb-8">
			<h1 class="text-2xl font-bold text-foreground">Clock</h1>
			<p class="text-muted-foreground text-sm mt-1">Dein Zeit-Management Hub</p>
		</header>

		<!-- Current Time Display -->
		<div class="current-time-card mb-8 p-6 rounded-xl bg-card border border-border">
			<div class="flex items-center gap-4">
				<div class="p-3 rounded-full bg-primary/10">
					<Clock size={32} class="text-primary" />
				</div>
				<div>
					<div class="text-4xl font-bold text-foreground tabular-nums">
						{new Date().toLocaleTimeString('de-DE', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
						})}
					</div>
					<div class="text-muted-foreground">
						{new Date().toLocaleDateString('de-DE', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						})}
					</div>
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
