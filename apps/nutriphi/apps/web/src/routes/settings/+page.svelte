<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiClient } from '$lib/api/client';
	import { DEFAULT_DAILY_VALUES } from '@nutriphi/shared';
	import { ArrowLeft, Save, Loader2, AlertCircle, LogOut, User, Target } from 'lucide-svelte';

	interface UserGoals {
		dailyCalories: number;
		dailyProtein: number;
		dailyCarbs: number;
		dailyFat: number;
		dailyFiber: number;
	}

	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let success = $state('');

	let dailyCalories = $state<number>(DEFAULT_DAILY_VALUES.calories);
	let dailyProtein = $state<number>(DEFAULT_DAILY_VALUES.protein);
	let dailyCarbs = $state<number>(DEFAULT_DAILY_VALUES.carbohydrates);
	let dailyFat = $state<number>(DEFAULT_DAILY_VALUES.fat);
	let dailyFiber = $state<number>(DEFAULT_DAILY_VALUES.fiber);

	// Redirect if not authenticated
	$effect(() => {
		if (!authStore.loading && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	onMount(async () => {
		try {
			const goals = await apiClient.get<UserGoals | null>('/goals');
			if (goals) {
				dailyCalories = goals.dailyCalories;
				dailyProtein = goals.dailyProtein ?? DEFAULT_DAILY_VALUES.protein;
				dailyCarbs = goals.dailyCarbs ?? DEFAULT_DAILY_VALUES.carbohydrates;
				dailyFat = goals.dailyFat ?? DEFAULT_DAILY_VALUES.fat;
				dailyFiber = goals.dailyFiber ?? DEFAULT_DAILY_VALUES.fiber;
			}
		} catch (err) {
			// No goals set yet, use defaults
		} finally {
			loading = false;
		}
	});

	async function saveGoals() {
		error = '';
		success = '';
		saving = true;

		try {
			await apiClient.post('/goals', {
				dailyCalories,
				dailyProtein,
				dailyCarbs,
				dailyFat,
				dailyFiber,
			});
			success = 'Ziele gespeichert!';
			setTimeout(() => (success = ''), 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
		} finally {
			saving = false;
		}
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}
</script>

<div class="min-h-screen bg-[var(--color-background-page)]">
	<!-- Header -->
	<header
		class="sticky top-0 z-40 bg-[var(--color-background-page)]/95 backdrop-blur border-b border-[var(--color-border)]"
	>
		<div class="container mx-auto px-4 max-w-lg">
			<div class="flex items-center h-14">
				<button
					onclick={() => goto('/')}
					class="p-2 -ml-2 rounded-lg hover:bg-[var(--color-background-card)]"
				>
					<ArrowLeft class="w-5 h-5 text-[var(--color-text-secondary)]" />
				</button>
				<h1 class="ml-2 font-semibold text-[var(--color-text-primary)]">Einstellungen</h1>
			</div>
		</div>
	</header>

	<main class="container mx-auto px-4 py-6 max-w-lg space-y-6">
		<!-- User Info -->
		<section
			class="bg-[var(--color-background-card)] rounded-xl p-4 border border-[var(--color-border)]"
		>
			<div class="flex items-center gap-3 mb-4">
				<div
					class="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center"
				>
					<User class="w-5 h-5 text-[var(--color-primary)]" />
				</div>
				<div>
					<h2 class="font-semibold text-[var(--color-text-primary)]">Konto</h2>
					<p class="text-sm text-[var(--color-text-secondary)]">
						{authStore.user?.email ?? 'Nicht angemeldet'}
					</p>
				</div>
			</div>
			<button
				onclick={handleLogout}
				class="w-full py-2.5 px-4 bg-[var(--color-background-elevated)] hover:bg-red-500/20 text-[var(--color-text-secondary)] hover:text-red-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
			>
				<LogOut class="w-4 h-4" />
				Abmelden
			</button>
		</section>

		<!-- Daily Goals -->
		<section
			class="bg-[var(--color-background-card)] rounded-xl p-4 border border-[var(--color-border)]"
		>
			<div class="flex items-center gap-3 mb-4">
				<div
					class="w-10 h-10 rounded-full bg-[var(--color-calories)]/20 flex items-center justify-center"
				>
					<Target class="w-5 h-5 text-[var(--color-calories)]" />
				</div>
				<div>
					<h2 class="font-semibold text-[var(--color-text-primary)]">Tagesziele</h2>
					<p class="text-sm text-[var(--color-text-secondary)]">Passe deine Ziele an</p>
				</div>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-8">
					<Loader2 class="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
				</div>
			{:else}
				<div class="space-y-4">
					<!-- Calories -->
					<div>
						<label
							for="calories"
							class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
						>
							Kalorien (kcal)
						</label>
						<input
							id="calories"
							type="number"
							bind:value={dailyCalories}
							min="500"
							max="10000"
							class="w-full px-3 py-2 bg-[var(--color-background-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>

					<!-- Protein -->
					<div>
						<label
							for="protein"
							class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
						>
							Protein (g)
						</label>
						<input
							id="protein"
							type="number"
							bind:value={dailyProtein}
							min="0"
							max="500"
							class="w-full px-3 py-2 bg-[var(--color-background-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>

					<!-- Carbs -->
					<div>
						<label
							for="carbs"
							class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
						>
							Kohlenhydrate (g)
						</label>
						<input
							id="carbs"
							type="number"
							bind:value={dailyCarbs}
							min="0"
							max="1000"
							class="w-full px-3 py-2 bg-[var(--color-background-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>

					<!-- Fat -->
					<div>
						<label
							for="fat"
							class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
						>
							Fett (g)
						</label>
						<input
							id="fat"
							type="number"
							bind:value={dailyFat}
							min="0"
							max="500"
							class="w-full px-3 py-2 bg-[var(--color-background-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>

					<!-- Fiber -->
					<div>
						<label
							for="fiber"
							class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
						>
							Ballaststoffe (g)
						</label>
						<input
							id="fiber"
							type="number"
							bind:value={dailyFiber}
							min="0"
							max="100"
							class="w-full px-3 py-2 bg-[var(--color-background-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>

					{#if error}
						<div
							class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm"
						>
							<AlertCircle class="w-4 h-4 flex-shrink-0" />
							<span>{error}</span>
						</div>
					{/if}

					{#if success}
						<div
							class="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm text-center"
						>
							{success}
						</div>
					{/if}

					<button
						onclick={saveGoals}
						disabled={saving}
						class="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
					>
						{#if saving}
							<Loader2 class="w-5 h-5 animate-spin" />
							Speichern...
						{:else}
							<Save class="w-5 h-5" />
							Ziele speichern
						{/if}
					</button>
				</div>
			{/if}
		</section>

		<!-- App Info -->
		<section class="text-center text-sm text-[var(--color-text-muted)] py-4">
			<p>NutriPhi v1.0.0</p>
			<p class="mt-1">KI-gestützte Ernährungsanalyse</p>
		</section>
	</main>
</div>
