<script lang="ts">
	import { db } from '$lib/data/database';
	import { useAllGoals } from '$lib/modules/nutriphi/queries';
	import { DEFAULT_DAILY_VALUES, NUTRIENT_INFO } from '$lib/modules/nutriphi/constants';
	import { ArrowLeft } from '@mana/shared-icons';

	const allGoals = useAllGoals();
	let currentGoals = $derived(allGoals.value[0] ?? null);

	// DEFAULT_DAILY_VALUES is `as const`, so its fields are literal types
	// (e.g. `2000`). Widen to plain `number` so the user can edit them
	// without TS rejecting the assignment as a literal-type mismatch.
	let dailyCalories = $state<number>(DEFAULT_DAILY_VALUES.calories);
	let dailyProtein = $state<number>(DEFAULT_DAILY_VALUES.protein);
	let dailyCarbs = $state<number>(DEFAULT_DAILY_VALUES.carbohydrates);
	let dailyFat = $state<number>(DEFAULT_DAILY_VALUES.fat);
	let dailyFiber = $state<number>(DEFAULT_DAILY_VALUES.fiber);

	let saving = $state(false);
	let saved = $state(false);

	// Load current goals when they become available
	$effect(() => {
		if (currentGoals) {
			dailyCalories = currentGoals.dailyCalories ?? DEFAULT_DAILY_VALUES.calories;
			dailyProtein = currentGoals.dailyProtein ?? DEFAULT_DAILY_VALUES.protein;
			dailyCarbs = currentGoals.dailyCarbs ?? DEFAULT_DAILY_VALUES.carbohydrates;
			dailyFat = currentGoals.dailyFat ?? DEFAULT_DAILY_VALUES.fat;
			dailyFiber = currentGoals.dailyFiber ?? DEFAULT_DAILY_VALUES.fiber;
		}
	});

	async function handleSave() {
		saving = true;
		saved = false;

		try {
			const now = new Date().toISOString();
			const goalData = {
				dailyCalories,
				dailyProtein,
				dailyCarbs,
				dailyFat,
				dailyFiber,
				updatedAt: now,
			};

			if (currentGoals) {
				await db.table('goals').update(currentGoals.id, goalData);
			} else {
				await db.table('goals').add({
					id: crypto.randomUUID(),
					...goalData,
					createdAt: now,
				});
			}

			saved = true;
			setTimeout(() => (saved = false), 2000);
		} finally {
			saving = false;
		}
	}

	function resetToDefaults() {
		dailyCalories = DEFAULT_DAILY_VALUES.calories;
		dailyProtein = DEFAULT_DAILY_VALUES.protein;
		dailyCarbs = DEFAULT_DAILY_VALUES.carbohydrates;
		dailyFat = DEFAULT_DAILY_VALUES.fat;
		dailyFiber = DEFAULT_DAILY_VALUES.fiber;
	}
</script>

<svelte:head>
	<title>Ziele - NutriPhi - Mana</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div>
		<a
			href="/nutriphi"
			class="mb-4 inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
		>
			<ArrowLeft class="h-4 w-4" />
			Zurueck
		</a>
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Tagesziele</h1>
		<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
			Passe deine taeglichen Naehrwertziele an
		</p>
	</div>

	{#if saved}
		<div
			class="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
		>
			Ziele gespeichert!
		</div>
	{/if}

	<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
		<!-- Calories -->
		<div>
			<label
				for="g-cal"
				class="mb-1 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]"
			>
				<div
					class="h-3 w-3 rounded-full"
					style="background-color: {NUTRIENT_INFO.calories.color}"
				></div>
				Kalorien (kcal)
			</label>
			<input
				id="g-cal"
				type="number"
				bind:value={dailyCalories}
				min="0"
				step="50"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<!-- Protein -->
		<div>
			<label
				for="g-prot"
				class="mb-1 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]"
			>
				<div
					class="h-3 w-3 rounded-full"
					style="background-color: {NUTRIENT_INFO.protein.color}"
				></div>
				Protein (g)
			</label>
			<input
				id="g-prot"
				type="number"
				bind:value={dailyProtein}
				min="0"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<!-- Carbs -->
		<div>
			<label
				for="g-carbs"
				class="mb-1 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]"
			>
				<div
					class="h-3 w-3 rounded-full"
					style="background-color: {NUTRIENT_INFO.carbohydrates.color}"
				></div>
				Kohlenhydrate (g)
			</label>
			<input
				id="g-carbs"
				type="number"
				bind:value={dailyCarbs}
				min="0"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<!-- Fat -->
		<div>
			<label
				for="g-fat"
				class="mb-1 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]"
			>
				<div class="h-3 w-3 rounded-full" style="background-color: {NUTRIENT_INFO.fat.color}"></div>
				Fett (g)
			</label>
			<input
				id="g-fat"
				type="number"
				bind:value={dailyFat}
				min="0"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<!-- Fiber -->
		<div>
			<label
				for="g-fiber"
				class="mb-1 flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]"
			>
				<div
					class="h-3 w-3 rounded-full"
					style="background-color: {NUTRIENT_INFO.fiber.color}"
				></div>
				Ballaststoffe (g)
			</label>
			<input
				id="g-fiber"
				type="number"
				bind:value={dailyFiber}
				min="0"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			/>
		</div>

		<!-- Actions -->
		<div class="flex gap-3 pt-2">
			<button
				onclick={resetToDefaults}
				class="rounded-lg border border-[hsl(var(--border))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
			>
				Standardwerte
			</button>
			<button
				onclick={handleSave}
				disabled={saving}
				class="flex-1 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
			>
				{saving ? 'Speichert...' : 'Ziele speichern'}
			</button>
		</div>
	</div>

	<!-- Info -->
	<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-4">
		<p class="text-sm text-[hsl(var(--muted-foreground))]">
			Die Standardwerte basieren auf einer 2000 kcal Diaet. Passe sie an deine individuellen
			Beduerfnisse an. Konsultiere bei Bedarf einen Ernaehrungsberater.
		</p>
	</div>
</div>
