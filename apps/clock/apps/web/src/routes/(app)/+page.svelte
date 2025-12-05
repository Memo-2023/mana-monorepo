<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ClockFace } from '$lib/components/clock-faces';
	import { clockFaceStore } from '$lib/stores/clock-face.svelte';

	// Current time state
	let currentTime = $state(new Date());
	let interval: ReturnType<typeof setInterval> | null = null;

	// Derived time values
	let hours = $derived(currentTime.getHours());
	let minutes = $derived(currentTime.getMinutes());
	let seconds = $derived(currentTime.getSeconds());

	// Formatted time strings
	let timeString = $derived(
		`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
	);
	let dateString = $derived(
		currentTime.toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		})
	);

	// Days remaining calculations
	let daysLeftInMonth = $derived(() => {
		const year = currentTime.getFullYear();
		const month = currentTime.getMonth();
		const lastDay = new Date(year, month + 1, 0).getDate();
		const today = currentTime.getDate();
		return lastDay - today;
	});

	let daysLeftInYear = $derived(() => {
		const year = currentTime.getFullYear();
		const endOfYear = new Date(year, 11, 31);
		const today = new Date(year, currentTime.getMonth(), currentTime.getDate());
		const diffTime = endOfYear.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	});

	// Selected clock face
	let selectedFace = $derived(clockFaceStore.selectedFace);

	onMount(() => {
		clockFaceStore.initialize();
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

<div class="home-container">
	<!-- Center: Clock Face and Info -->
	<div class="clock-center">
		<div class="clock-display">
			<ClockFace type={selectedFace} {hours} {minutes} {seconds} size={320} />
		</div>

		<!-- Info below clock -->
		<div class="bottom-info">
			<p class="time-display">{timeString}</p>
			<p class="date-display">{dateString}</p>
			<div class="countdown-info">
				<span class="countdown-item">
					<span class="countdown-value">{daysLeftInMonth()}</span>
					<span class="countdown-label">Tage bis Monatsende</span>
				</span>
				<span class="countdown-divider">·</span>
				<span class="countdown-item">
					<span class="countdown-value">{daysLeftInYear()}</span>
					<span class="countdown-label">Tage bis Jahresende</span>
				</span>
			</div>
		</div>
	</div>

	<!-- Bottom Right: Customize link -->
	<a href="/clock-faces" class="customize-link"> Zifferblatt anpassen </a>
</div>

<style>
	.home-container {
		position: relative;
		display: flex;
		flex-direction: column;
		height: calc(100vh - 120px);
		min-height: 400px;
	}

	.bottom-info {
		text-align: center;
		margin-top: 1.5rem;
	}

	.time-display {
		font-size: 2.5rem;
		font-weight: 300;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		letter-spacing: 0.02em;
	}

	.date-display {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}

	.countdown-info {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 1rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.countdown-item {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.countdown-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	.countdown-label {
		opacity: 0.8;
	}

	.countdown-divider {
		opacity: 0.4;
	}

	.clock-center {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.clock-display {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.customize-link {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		transition: color 0.15s ease;
	}

	.customize-link:hover {
		color: hsl(var(--color-foreground));
	}
</style>
