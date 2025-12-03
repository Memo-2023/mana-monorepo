<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';

	// Current time state
	let currentTime = $state(new Date());
	let interval: ReturnType<typeof setInterval> | null = null;

	// Derived time values
	let hours = $derived(currentTime.getHours());
	let minutes = $derived(currentTime.getMinutes());
	let seconds = $derived(currentTime.getSeconds());

	// Formatted time strings
	let timeString = $derived(
		`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	);
	let dateString = $derived(
		currentTime.toLocaleDateString('de-DE', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	);

	// Clock hand rotations
	let secondRotation = $derived((seconds / 60) * 360);
	let minuteRotation = $derived(((minutes + seconds / 60) / 60) * 360);
	let hourRotation = $derived((((hours % 12) + minutes / 60) / 12) * 360);

	onMount(() => {
		interval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-3xl font-bold text-foreground">{$_('dashboard.title')}</h1>
		<p class="mt-2 text-muted-foreground">{dateString}</p>
	</div>

	<!-- Main Clock Display -->
	<div class="flex flex-col items-center gap-8 lg:flex-row lg:justify-center lg:gap-16">
		<!-- Analog Clock -->
		<div class="clock-face">
			<!-- Hour markers -->
			{#each Array(12) as _, i}
				<div
					class="clock-marker hour-marker"
					style="transform: translateX(-50%) rotate({i * 30}deg) translateY(-130px)"
				></div>
			{/each}

			<!-- Minute markers -->
			{#each Array(60) as _, i}
				{#if i % 5 !== 0}
					<div
						class="clock-marker minute-marker"
						style="transform: translateX(-50%) rotate({i * 6}deg) translateY(-134px)"
					></div>
				{/if}
			{/each}

			<!-- Clock hands -->
			<div
				class="clock-hand hour"
				style="transform: translateX(-50%) rotate({hourRotation}deg)"
			></div>
			<div
				class="clock-hand minute"
				style="transform: translateX(-50%) rotate({minuteRotation}deg)"
			></div>
			<div
				class="clock-hand second"
				style="transform: translateX(-50%) rotate({secondRotation}deg)"
			></div>

			<!-- Center dot -->
			<div class="clock-center"></div>
		</div>

		<!-- Digital Clock -->
		<div class="text-center">
			<div class="digital-clock digital-clock-large text-foreground">
				{timeString}
			</div>
		</div>
	</div>

	<!-- Quick Access Cards -->
	<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Next Alarm Card -->
		<a href="/alarms" class="card hover:border-primary/50 transition-colors">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
					<span class="text-xl">🔔</span>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">{$_('dashboard.nextAlarm')}</p>
					<p class="font-medium text-foreground">Nicht eingestellt</p>
				</div>
			</div>
		</a>

		<!-- Active Timers Card -->
		<a href="/timers" class="card hover:border-primary/50 transition-colors">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
					<span class="text-xl">⏱</span>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">{$_('dashboard.activeTimers')}</p>
					<p class="font-medium text-foreground">0 aktiv</p>
				</div>
			</div>
		</a>

		<!-- Stopwatch Card -->
		<a href="/stopwatch" class="card hover:border-primary/50 transition-colors">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
					<span class="text-xl">⏲</span>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">{$_('nav.stopwatch')}</p>
					<p class="font-medium text-foreground">Bereit</p>
				</div>
			</div>
		</a>

		<!-- World Clock Card -->
		<a href="/world-clock" class="card hover:border-primary/50 transition-colors">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
					<span class="text-xl">🌍</span>
				</div>
				<div>
					<p class="text-sm text-muted-foreground">{$_('dashboard.worldClocks')}</p>
					<p class="font-medium text-foreground">0 Städte</p>
				</div>
			</div>
		</a>
	</div>

	<!-- Pomodoro Quick Start -->
	<div class="card mt-6">
		<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
			<div>
				<h3 class="text-lg font-semibold text-foreground">{$_('pomodoro.title')}</h3>
				<p class="text-sm text-muted-foreground">Starte eine fokussierte Arbeitssitzung</p>
			</div>
			<a href="/pomodoro" class="btn btn-primary btn-lg">
				{$_('pomodoro.start')}
			</a>
		</div>
	</div>
</div>
