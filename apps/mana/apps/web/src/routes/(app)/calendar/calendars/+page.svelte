<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { calendarsStore } from '$lib/modules/calendar/stores/calendars.svelte';
	import type { Calendar } from '$lib/modules/calendar/types';
	import { CaretLeft, Plus, Trash, Eye, EyeSlash, Star } from '@mana/shared-icons';

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	// Create calendar form
	let showCreateForm = $state(false);
	let newName = $state('');
	let newColor = $state('#3B82F6');

	const PRESET_COLORS = [
		'#3B82F6',
		'#EF4444',
		'#10B981',
		'#F59E0B',
		'#8B5CF6',
		'#EC4899',
		'#14B8A6',
		'#F97316',
	];

	async function handleCreate() {
		if (!newName.trim()) return;
		await calendarsStore.createCalendar({
			name: newName,
			color: newColor,
		});
		newName = '';
		newColor = '#3B82F6';
		showCreateForm = false;
	}

	async function handleToggleVisibility(id: string) {
		await calendarsStore.toggleVisibility(id, calendarsCtx.value);
	}

	async function handleSetDefault(id: string) {
		await calendarsStore.setAsDefault(id, calendarsCtx.value);
	}

	async function handleDelete(id: string) {
		if (!confirm('Kalender wirklich löschen? Alle zugehörigen Termine gehen verloren.')) return;
		await calendarsStore.deleteCalendar(id);
	}
</script>

<svelte:head>
	<title>Kalender verwalten - Mana</title>
</svelte:head>

<div class="mx-auto max-w-2xl p-4">
	<a
		href="/calendar"
		class="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
	>
		<CaretLeft size={16} />
		Zurück zum Kalender
	</a>

	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">Meine Kalender</h1>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
		>
			<Plus size={16} />
			Neuer Kalender
		</button>
	</div>

	<!-- Create Form -->
	{#if showCreateForm}
		<div class="mb-6 rounded-xl border border-border bg-card p-4">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
				class="space-y-3"
			>
				<div>
					<label for="cal-name" class="mb-1 block text-sm font-medium text-foreground">Name</label>
					<input
						id="cal-name"
						type="text"
						bind:value={newName}
						placeholder="z.B. Arbeit, Sport, Familie..."
						required
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-2 block text-sm font-medium text-foreground">Farbe</label>
					<div class="flex gap-2">
						<!-- svelte-ignore a11y_consider_explicit_label -->
						{#each PRESET_COLORS as color}
							<button
								type="button"
								onclick={() => (newColor = color)}
								class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 {newColor ===
								color
									? 'border-foreground scale-110'
									: 'border-transparent'}"
								style="background-color: {color}"
							></button>
						{/each}
					</div>
				</div>

				<div class="flex gap-2 pt-1">
					<button
						type="button"
						onclick={() => (showCreateForm = false)}
						class="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						disabled={!newName.trim()}
						class="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
					>
						Erstellen
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Calendar List -->
	<div class="space-y-2">
		{#if calendarsCtx.value.length === 0}
			<div class="py-12 text-center text-muted-foreground">Noch keine Kalender vorhanden.</div>
		{:else}
			{#each calendarsCtx.value as cal (cal.id)}
				<div class="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
					<div
						class="h-4 w-4 flex-shrink-0 rounded-full"
						style="background-color: {cal.color}"
					></div>
					<div class="flex-1 min-w-0">
						<div class="font-medium text-foreground">
							{cal.name}
							{#if cal.isDefault}
								<span class="ml-1 text-xs text-primary">(Standard)</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-1">
						<button
							onclick={() => handleToggleVisibility(cal.id)}
							class="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
							title={cal.isVisible ? 'Ausblenden' : 'Einblenden'}
						>
							{#if cal.isVisible}
								<Eye size={16} />
							{:else}
								<EyeSlash size={16} />
							{/if}
						</button>
						{#if !cal.isDefault}
							<button
								onclick={() => handleSetDefault(cal.id)}
								class="rounded-lg p-1.5 text-muted-foreground hover:text-amber-500 transition-colors"
								title="Als Standard setzen"
							>
								<Star size={16} />
							</button>
						{/if}
						<button
							onclick={() => handleDelete(cal.id)}
							class="rounded-lg p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
							title={$_('common.delete')}
						>
							<Trash size={16} />
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
