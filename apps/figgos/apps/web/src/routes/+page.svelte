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
	<div class="mx-auto max-w-md px-6 pt-8">
		<!-- Badge -->
		<div class="mb-5 flex justify-center">
			<span
				class="inline-block rounded bg-secondary px-3.5 py-1 text-[11px] font-black uppercase tracking-[3px] text-secondary-foreground"
				style="transform: rotate(-2deg)"
			>
				Unboxing
			</span>
		</div>

		<!-- Figure Card -->
		<div class="brutal-shadow rounded-lg">
			<div
				class="rounded-lg border-3 border-border bg-surface p-6"
			>
				<!-- Image placeholder -->
				<div
					class="mx-auto mb-5 flex h-[200px] w-[200px] items-center justify-center rounded-lg border-2 border-border-muted bg-input"
				>
					<span class="text-xs text-muted-foreground">Image coming soon</span>
				</div>

				<h2 class="text-center text-[22px] font-black tracking-tight text-foreground">
					{result.name}
				</h2>
				<p class="mt-3 text-center text-sm leading-5 text-muted-foreground">
					{result.userInput.description}
				</p>

				<!-- Rarity Badge -->
				<div class="mt-4 flex justify-center">
					<div class="relative">
						<div
							class="absolute rounded-full"
							style="top: 3px; left: 2px; right: -2px; bottom: -3px; background-color: {RARITY_SHADOW[result.rarity]}"
						></div>
						<span
							class="relative inline-block rounded-full border-2 border-white/20 px-5 py-2 text-xs font-black uppercase tracking-[2px]"
							style="background-color: var(--color-rarity-{result.rarity}); color: var(--color-rarity-{result.rarity}-foreground)"
						>
							{result.rarity}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Create Another -->
		<div class="mt-8">
			<button onclick={handleReset} class="group w-full cursor-pointer">
				<div class="relative">
					<div
						class="absolute rounded-lg bg-accent-dark"
						style="top: 5px; left: 3px; right: -3px; bottom: -5px"
					></div>
					<div
						class="relative rounded-lg border-2 border-white/15 bg-accent py-4 text-center text-base font-black uppercase tracking-wider text-accent-foreground transition-opacity group-hover:opacity-90"
					>
						Create Another
					</div>
				</div>
			</button>
		</div>
	</div>
{:else}
	<!-- ── Create Form ── -->
	<div class="mx-auto max-w-md px-6">
		<!-- Header -->
		<div class="flex flex-col items-center pb-8 pt-10">
			<span
				class="mb-2 inline-block rounded bg-secondary px-3.5 py-1 text-[11px] font-black uppercase tracking-[3px] text-secondary-foreground"
				style="transform: rotate(-2deg)"
			>
				New Drop
			</span>
			<h1 class="text-center text-[32px] font-black leading-tight tracking-tight text-foreground">
				CREATE YOUR<br />FIGGO
			</h1>
		</div>

		<!-- Form -->
		<div>
			<!-- Name -->
			<label
				class="mb-2 block text-[13px] font-black uppercase tracking-[3px] text-primary"
				for="name"
			>
				Name
			</label>
			<div class="brutal-shadow mb-6 rounded-lg">
				<input
					id="name"
					type="text"
					bind:value={name}
					maxlength={200}
					placeholder="Captain Thunderstrike"
					class="w-full rounded-lg border-3 border-border bg-input px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					style="height: 52px"
				/>
			</div>

			<!-- Story -->
			<label
				class="mb-2 block text-[13px] font-black uppercase tracking-[3px] text-primary"
				for="story"
			>
				Story
			</label>
			<div class="brutal-shadow mb-6 rounded-lg">
				<textarea
					id="story"
					bind:value={description}
					maxlength={2000}
					rows={4}
					placeholder="A cyberpunk warrior with lightning gauntlets..."
					class="w-full rounded-lg border-3 border-border bg-input px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					style="min-height: 120px; resize: vertical"
				></textarea>
			</div>

			<!-- Error -->
			{#if error}
				<div class="mb-4 rounded-lg border-2 border-destructive/30 bg-destructive/10 p-3">
					<p class="text-center text-sm font-semibold text-destructive">{error}</p>
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
						class="absolute rounded-lg bg-primary-dark"
						style="top: 6px; left: 4px; right: -4px; bottom: -6px"
					></div>
					<div
						class="relative rounded-lg border-3 border-[rgb(255,224,102)] bg-primary py-[18px] text-center text-lg font-black uppercase tracking-[2px] text-primary-foreground transition-opacity group-hover:opacity-90"
					>
						{#if loading}
							<span class="inline-flex items-center gap-2">
								<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
