<script lang="ts">
	import type { FigureResponse, FigureRarity } from '@figgos/shared';

	let name = $state('');
	let description = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let result = $state<FigureResponse | null>(null);

	const RARITY_SHADOW: Record<FigureRarity, string> = {
		common: 'rgb(80, 90, 100)',
		rare: 'rgb(60, 120, 180)',
		epic: 'rgb(120, 80, 180)',
		legendary: 'rgb(180, 130, 20)',
	};

	async function handleGenerate() {
		if (!name.trim() || !description.trim()) {
			error = 'Give your figure a name and a story';
			return;
		}
		loading = true;
		error = null;
		try {
			await new Promise((r) => setTimeout(r, 1500));
			const rarities: FigureRarity[] = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'legendary'];
			result = {
				id: 'mock-id',
				userId: 'mock-user',
				name: name.trim(),
				userInput: { description: description.trim() },
				imageUrl: null,
				rarity: rarities[Math.floor(Math.random() * rarities.length)],
				isPublic: false,
				isArchived: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
		} catch (e: any) {
			error = e.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	function handleReset() {
		name = '';
		description = '';
		result = null;
		error = null;
	}
</script>

{#if result}
	<!-- ── Result Screen ── -->
	<div class="mx-auto max-w-xl px-6 pt-10">
		<!-- Badge -->
		<div class="mb-6 flex justify-center">
			<span
				class="inline-block rounded bg-secondary px-4 py-1.5 text-sm font-black uppercase tracking-[3px] text-secondary-foreground"
				style="transform: rotate(-2deg)"
			>
				Unboxing
			</span>
		</div>

		<!-- Figure Card -->
		<div class="brutal-shadow rounded-xl">
			<div
				class="rounded-xl border-3 border-border bg-surface p-8"
			>
				<!-- Image placeholder -->
				<div
					class="mx-auto mb-6 flex h-[260px] w-[260px] items-center justify-center rounded-xl border-2 border-border-muted bg-input"
				>
					<span class="text-base text-muted-foreground">Image coming soon</span>
				</div>

				<h2 class="text-center text-3xl font-black tracking-tight text-foreground">
					{result.name}
				</h2>
				<p class="mt-4 text-center text-lg leading-6 text-muted-foreground">
					{result.userInput.description}
				</p>

				<!-- Rarity Badge -->
				<div class="mt-6 flex justify-center">
					<div class="relative">
						<div
							class="absolute rounded-full"
							style="top: 3px; left: 2px; right: -2px; bottom: -3px; background-color: {RARITY_SHADOW[result.rarity]}"
						></div>
						<span
							class="relative inline-block rounded-full border-2 border-white/20 px-6 py-2.5 text-sm font-black uppercase tracking-[2px]"
							style="background-color: var(--color-rarity-{result.rarity}); color: var(--color-rarity-{result.rarity}-foreground)"
						>
							{result.rarity}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Create Another -->
		<div class="mt-10">
			<button onclick={handleReset} class="group w-full cursor-pointer">
				<div class="relative">
					<div
						class="absolute rounded-xl bg-accent-dark"
						style="top: 5px; left: 3px; right: -3px; bottom: -5px"
					></div>
					<div
						class="relative rounded-xl border-2 border-white/15 bg-accent py-5 text-center text-lg font-black uppercase tracking-wider text-accent-foreground transition-opacity group-hover:opacity-90"
					>
						Create Another
					</div>
				</div>
			</button>
		</div>
	</div>
{:else}
	<!-- ── Create Form ── -->
	<div class="mx-auto max-w-xl px-6">
		<!-- Header -->
		<div class="flex flex-col items-center pb-10 pt-12">
			<span
				class="mb-3 inline-block rounded bg-secondary px-4 py-1.5 text-sm font-black uppercase tracking-[3px] text-secondary-foreground"
				style="transform: rotate(-2deg)"
			>
				New Drop
			</span>
			<h1 class="text-center text-5xl font-black leading-tight tracking-tight text-foreground">
				CREATE YOUR<br />FIGGO
			</h1>
		</div>

		<!-- Form -->
		<div>
			<!-- Name -->
			<label
				class="mb-2.5 block text-base font-black uppercase tracking-[3px] text-primary"
				for="name"
			>
				Name
			</label>
			<div class="brutal-shadow mb-8 rounded-xl">
				<input
					id="name"
					type="text"
					bind:value={name}
					maxlength={200}
					placeholder="Captain Thunderstrike"
					class="w-full rounded-xl border-3 border-border bg-input px-5 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					style="height: 60px"
				/>
			</div>

			<!-- Story -->
			<label
				class="mb-2.5 block text-base font-black uppercase tracking-[3px] text-primary"
				for="story"
			>
				Story
			</label>
			<div class="brutal-shadow mb-8 rounded-xl">
				<textarea
					id="story"
					bind:value={description}
					maxlength={2000}
					rows={4}
					placeholder="A cyberpunk warrior with lightning gauntlets..."
					class="w-full rounded-xl border-3 border-border bg-input px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					style="min-height: 150px; resize: vertical"
				></textarea>
			</div>

			<!-- Error -->
			{#if error}
				<div class="mb-5 rounded-xl border-2 border-destructive/30 bg-destructive/10 p-4">
					<p class="text-center text-base font-semibold text-destructive">{error}</p>
				</div>
			{/if}

			<!-- Generate Button -->
			<button
				onclick={handleGenerate}
				disabled={loading}
				class="group w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
			>
				<div class="relative">
					<div
						class="absolute rounded-xl bg-primary-dark"
						style="top: 6px; left: 4px; right: -4px; bottom: -6px"
					></div>
					<div
						class="relative rounded-xl border-3 border-[rgb(255,224,102)] bg-primary py-5 text-center text-xl font-black uppercase tracking-[2px] text-primary-foreground transition-opacity group-hover:opacity-90"
					>
						{#if loading}
							<span class="inline-flex items-center gap-2">
								<svg class="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Rolling...
							</span>
						{:else}
							Generate Figgo
						{/if}
					</div>
				</div>
			</button>
		</div>
	</div>
{/if}
