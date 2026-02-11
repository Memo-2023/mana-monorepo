<script lang="ts">
	import { page } from '$app/state';
	import type { FigureResponse, FigureRarity } from '@figgos/shared';
	import { api } from '$lib/api';

	const RARITY_COLORS: Record<FigureRarity, string> = {
		common: 'rgb(136, 136, 170)',
		rare: 'rgb(100, 180, 255)',
		epic: 'rgb(180, 130, 255)',
		legendary: 'rgb(255, 185, 30)',
	};

	const STAT_COLORS = {
		attack: 'rgb(255, 51, 102)',
		defense: 'rgb(0, 210, 170)',
		special: 'rgb(180, 130, 255)',
	};

	let figure = $state<FigureResponse | null>(null);
	let loading = $state(true);

	$effect(() => {
		const id = page.params.id;
		if (!id) return;
		loading = true;
		api.figures
			.get(id)
			.then(({ figure: f }) => (figure = f))
			.catch(() => (figure = null))
			.finally(() => (loading = false));
	});

	let profile = $derived(figure?.generatedProfile);

	// Measure actual image size to match front/back
	let cardWidth = $state(0);
	let cardHeight = $state(0);
	let loaded = $state(false);

	function handleImageLoad(e: Event) {
		const img = e.target as HTMLImageElement;
		const natW = img.naturalWidth;
		const natH = img.naturalHeight;
		const maxW = window.innerWidth * 0.85;
		const maxH = window.innerHeight * 0.78;
		const ratio = Math.min(maxW / natW, maxH / natH);
		cardWidth = Math.round(natW * ratio);
		cardHeight = Math.round(natH * ratio);
		loaded = true;
	}

	// 3D rotation state
	let rotateY = $state(0);
	let savedRotateY = $state(0);
	let isDragging = $state(false);
	let startX = $state(0);

	function handlePointerDown(e: PointerEvent) {
		isDragging = true;
		startX = e.clientX;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		rotateY = savedRotateY + (e.clientX - startX) * 0.5;
	}

	function handlePointerUp() {
		if (!isDragging) return;
		isDragging = false;
		const normalised = ((rotateY % 360) + 360) % 360;
		let target: number;
		if (normalised < 90) target = 0;
		else if (normalised < 270) target = 180;
		else target = 360;
		const diff = target - normalised;
		const snapTo = rotateY + diff;
		savedRotateY = snapTo % 360;
		rotateY = snapTo;
	}

	function handleDoubleClick() {
		const target = savedRotateY + 180;
		savedRotateY = target % 360;
		rotateY = target;
	}

	// Fallback card size when no image
	function initFallbackSize() {
		const maxW = window.innerWidth * 0.85;
		const maxH = window.innerHeight * 0.78;
		cardWidth = Math.min(400, maxW);
		cardHeight = Math.min(600, maxH);
		loaded = true;
	}
</script>

{#if loading}
	<div class="flex min-h-[60vh] items-center justify-center">
		<svg class="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	</div>
{:else if figure}
	<!-- Header -->
	<div class="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
		<a
			href="/collection"
			class="text-base font-bold text-primary transition-opacity hover:opacity-70"
		>
			&larr; Back
		</a>
		<span class="text-xs font-semibold tracking-wider text-muted-foreground">
			Drag to rotate &middot; Double-click to flip
		</span>
	</div>

	<!-- Hidden image to measure natural dimensions -->
	{#if figure.imageUrl && !loaded}
		<img src={figure.imageUrl} alt="" class="invisible absolute" onload={handleImageLoad} />
	{/if}

	<!-- Init fallback size if no image -->
	{#if !figure.imageUrl && !loaded}
		{@const _ = initFallbackSize()}
	{/if}

	<!-- Card -->
	<div class="flex flex-col items-center justify-center" style="height: calc(100dvh - 52px)">
		{#if loaded}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="select-none"
				style="perspective: 1200px; width: {cardWidth}px; height: {cardHeight}px"
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={handlePointerUp}
				ondblclick={handleDoubleClick}
			>
				<div
					class="relative h-full w-full cursor-grab active:cursor-grabbing"
					style="
						transform-style: preserve-3d;
						transform: rotateY({rotateY}deg);
						transition: {isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'};
					"
				>
					<!-- Front: the image or placeholder -->
					<div
						class="absolute inset-0 overflow-hidden rounded-xl"
						style="backface-visibility: hidden"
					>
						{#if figure.imageUrl}
							<img
								src={figure.imageUrl}
								alt={figure.name}
								class="h-full w-full object-cover"
								draggable="false"
							/>
						{:else}
							<div
								class="flex h-full w-full flex-col items-center justify-center rounded-xl border-3 bg-surface"
								style="border-color: {RARITY_COLORS[figure.rarity]}"
							>
								<span class="text-2xl font-black text-foreground">{figure.name}</span>
								<span class="mt-2 text-sm text-muted-foreground">No image</span>
							</div>
						{/if}
					</div>

					<!-- Back -->
					<div
						class="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-xl border-3 bg-surface p-7"
						style="
							backface-visibility: hidden;
							transform: rotateY(180deg);
							border-color: {RARITY_COLORS[figure.rarity]};
						"
					>
						<!-- Shadow layer -->
						<div
							class="pointer-events-none absolute -bottom-[5px] -right-[5px] left-[5px] top-[5px] rounded-xl"
							style="background-color: {RARITY_COLORS[figure.rarity]}; opacity: 0.15; z-index: -1"
						></div>

						<!-- Header -->
						<div>
							<span
								class="mb-3 inline-block rounded bg-secondary px-3.5 py-1 text-sm font-black uppercase tracking-[2px] text-secondary-foreground"
								style="transform: rotate(-2deg)"
							>
								Backstory
							</span>
							<h2 class="text-4xl font-black tracking-tight text-foreground">
								{figure.name}
							</h2>
							{#if profile?.subtitle}
								<p
									class="mt-1.5 text-base font-extrabold uppercase tracking-[2px]"
									style="color: {RARITY_COLORS[figure.rarity]}"
								>
									{profile.subtitle}
								</p>
							{/if}
						</div>

						<!-- Description -->
						<p class="text-lg leading-7 text-muted-foreground">
							{profile?.backstory || figure.userInput.description}
						</p>

						<!-- Stats -->
						{#if profile?.stats}
							<div>
								<p
									class="mb-3 text-base font-black uppercase tracking-[3px]"
									style="color: {RARITY_COLORS[figure.rarity]}"
								>
									Stats
								</p>
								{#each [{ label: 'ATK', value: profile.stats.attack, color: STAT_COLORS.attack }, { label: 'DEF', value: profile.stats.defense, color: STAT_COLORS.defense }, { label: 'SPL', value: profile.stats.special, color: STAT_COLORS.special }] as stat (stat.label)}
									<div class="mb-3 flex items-center gap-3">
										<span class="w-12 text-base font-black tracking-wider text-muted-foreground">
											{stat.label}
										</span>
										<div
											class="h-3.5 flex-1 overflow-hidden rounded-full border border-border-muted bg-input"
										>
											<div
												class="h-full rounded-full"
												style="width: {stat.value}%; background-color: {stat.color}"
											></div>
										</div>
										<span class="w-9 text-right text-base font-extrabold text-foreground">
											{stat.value}
										</span>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Special Attack -->
						{#if profile?.specialAttack}
							<div class="rounded-lg bg-input p-3">
								<p class="text-xs font-black uppercase tracking-wider text-primary">
									⚡ {profile.specialAttack.name}
								</p>
							</div>
						{/if}

						<!-- Bottom: rarity + ID -->
						<div class="flex items-center justify-between">
							<span
								class="rounded-full px-5 py-2 text-sm font-black uppercase tracking-[2px]"
								style="
									background-color: {RARITY_COLORS[figure.rarity]};
									color: rgb(15, 15, 30);
								"
							>
								{figure.rarity}
							</span>
							<span class="text-sm font-semibold tracking-wider text-muted-foreground">
								#{figure.id.split('-').pop()?.toUpperCase()}
							</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="flex min-h-[60vh] items-center justify-center">
		<p class="text-lg font-bold text-foreground">Card not found</p>
	</div>
{/if}
