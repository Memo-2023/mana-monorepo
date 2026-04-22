<script lang="ts">
	import { Clock, Bell, Timer, Hourglass, Globe } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	const quickLinks = [
		{
			href: '/times/clock/world-clock',
			icon: Globe,
			label: 'Weltzeituhr',
			description: 'Zeitzonen im Blick',
			color: 'bg-blue-500',
		},
		{
			href: '/times/clock/alarms',
			icon: Bell,
			label: 'Wecker',
			description: 'Alarme verwalten',
			color: 'bg-amber-500',
		},
		{
			href: '/times/clock/timers',
			icon: Timer,
			label: 'Timer',
			description: 'Countdowns starten',
			color: 'bg-green-500',
		},
		{
			href: '/times/clock/stopwatch',
			icon: Hourglass,
			label: 'Stoppuhr',
			description: 'Zeit messen',
			color: 'bg-purple-500',
		},
	];
</script>

<svelte:head>
	<title>Clock - Mana</title>
</svelte:head>

<RoutePage appId="times" backHref="/times">
	<div class="mx-auto max-w-3xl">
		<header class="mb-8">
			<h1 class="text-2xl font-bold text-foreground">Clock</h1>
			<p class="text-muted-foreground mt-1 text-sm">Dein Zeit-Management Hub</p>
		</header>

		<!-- Current Time Display -->
		<div class="mb-8 rounded-xl border border-border bg-card p-6">
			<div class="flex items-center gap-4">
				<div class="rounded-full bg-primary/10 p-3">
					<Clock size={32} class="text-primary" />
				</div>
				<div>
					<div class="text-4xl font-bold tabular-nums text-foreground">
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
