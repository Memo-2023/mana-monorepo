<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { PageHeader } from '@manacore/shared-ui';
	import { ClockFace } from '$lib/components/clock-faces';
	import { clockFaceStore, CLOCK_FACES, type ClockFaceType } from '$lib/stores/clock-face.svelte';

	// Current time state for preview
	let currentTime = $state(new Date());
	let interval: ReturnType<typeof setInterval> | null = null;

	// Derived time values
	let hours = $derived(currentTime.getHours());
	let minutes = $derived(currentTime.getMinutes());
	let seconds = $derived(currentTime.getSeconds());

	// Group faces by category
	let analogFaces = $derived(CLOCK_FACES.filter((f) => f.category === 'analog'));
	let digitalFaces = $derived(CLOCK_FACES.filter((f) => f.category === 'digital'));

	// Current selection
	let selectedFace = $derived(clockFaceStore.selectedFace);

	function selectFace(face: ClockFaceType) {
		clockFaceStore.setFace(face);
	}

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

<PageHeader
	title={$_('clockFaces.title')}
	description={$_('clockFaces.subtitle')}
	size="md"
	centered
	backHref="/"
/>

<div class="space-y-8">
	<!-- Current Selection Preview -->
	<div class="card">
		<div class="flex flex-col items-center gap-4">
			<h2 class="text-lg font-semibold text-foreground">{$_('clockFaces.currentSelection')}</h2>
			<div class="clock-preview">
				<ClockFace type={selectedFace} {hours} {minutes} {seconds} size={240} />
			</div>
			<p class="text-sm text-muted-foreground">
				{$_(CLOCK_FACES.find((f) => f.id === selectedFace)?.nameKey || '')}
			</p>
		</div>
	</div>

	<!-- Analog Clock Faces -->
	<section>
		<h2 class="mb-4 text-xl font-semibold text-foreground">{$_('clockFaces.analog')}</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
			{#each analogFaces as face}
				<button
					type="button"
					class="face-card"
					class:selected={selectedFace === face.id}
					onclick={() => selectFace(face.id)}
				>
					<div class="face-preview">
						<ClockFace type={face.id} {hours} {minutes} {seconds} size={160} />
					</div>
					<div class="face-info">
						<h3 class="font-medium text-foreground">{$_(face.nameKey)}</h3>
						<p class="text-xs text-muted-foreground">{$_(face.descriptionKey)}</p>
					</div>
					{#if selectedFace === face.id}
						<div class="selected-badge">
							<span class="text-xs font-medium">{$_('clockFaces.selected')}</span>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</section>

	<!-- Digital Clock Faces -->
	<section>
		<h2 class="mb-4 text-xl font-semibold text-foreground">{$_('clockFaces.digital')}</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
			{#each digitalFaces as face}
				<button
					type="button"
					class="face-card"
					class:selected={selectedFace === face.id}
					onclick={() => selectFace(face.id)}
				>
					<div class="face-preview digital-preview">
						<ClockFace type={face.id} {hours} {minutes} {seconds} size={180} />
					</div>
					<div class="face-info">
						<h3 class="font-medium text-foreground">{$_(face.nameKey)}</h3>
						<p class="text-xs text-muted-foreground">{$_(face.descriptionKey)}</p>
					</div>
					{#if selectedFace === face.id}
						<div class="selected-badge">
							<span class="text-xs font-medium">{$_('clockFaces.selected')}</span>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</section>
</div>

<style>
	.clock-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.face-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px;
		background: hsl(var(--color-surface));
		border: 2px solid hsl(var(--color-border));
		border-radius: 12px;
		cursor: pointer;
		transition: all 200ms;
	}

	.face-card:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.face-card.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.05);
	}

	.face-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 180px;
		width: 100%;
		overflow: hidden;
	}

	.digital-preview {
		min-height: 120px;
		transform: scale(0.85);
	}

	.face-info {
		text-align: center;
		margin-top: 12px;
	}

	.selected-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		padding: 4px 8px;
		border-radius: 9999px;
	}
</style>
