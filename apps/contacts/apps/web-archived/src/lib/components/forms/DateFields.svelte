<script lang="ts">
	import { CalendarBlank, CaretDown, Cake, Trash, Plus } from '@manacore/shared-icons';

	interface CustomDate {
		id: string;
		label: string;
		date: string;
	}

	interface Props {
		birthday: string;
		customDates: CustomDate[];
		initiallyOpen?: boolean;
	}

	let {
		birthday = $bindable(''),
		customDates = $bindable([]),
		initiallyOpen = false,
	}: Props = $props();

	let isOpen = $state(initiallyOpen);

	// Auto-open if any field has data
	$effect(() => {
		if (birthday || customDates.length > 0) {
			isOpen = true;
		}
	});

	function addCustomDate() {
		customDates = [
			...customDates,
			{
				id: crypto.randomUUID(),
				label: '',
				date: '',
			},
		];
	}

	function removeCustomDate(id: string) {
		customDates = customDates.filter((d) => d.id !== id);
	}

	function updateCustomDate(id: string, field: 'label' | 'date', value: string) {
		customDates = customDates.map((d) => (d.id === id ? { ...d, [field]: value } : d));
	}
</script>

<section class="form-section">
	<button
		type="button"
		class="section-header section-header-toggle"
		onclick={() => (isOpen = !isOpen)}
	>
		<div class="section-icon">
			<CalendarBlank size={18} />
		</div>
		<h2 class="section-title">Daten</h2>
		<CaretDown size={20} class="chevron-icon {isOpen ? 'chevron-open' : ''}" />
	</button>
	{#if isOpen}
		<div class="dates-container">
			<!-- Birthday field -->
			<div class="form-field birthday-field">
				<label for="birthday" class="label date-label">
					<span class="date-icon-label">
						<Cake size={14} />
					</span>
					Geburtstag
				</label>
				<input id="birthday" type="date" bind:value={birthday} class="input" />
			</div>

			<!-- Custom dates -->
			{#each customDates as customDate (customDate.id)}
				<div class="custom-date-row">
					<div class="form-field custom-date-label-field">
						<label for="custom-label-{customDate.id}" class="label">Bezeichnung</label>
						<input
							id="custom-label-{customDate.id}"
							type="text"
							value={customDate.label}
							oninput={(e) => updateCustomDate(customDate.id, 'label', e.currentTarget.value)}
							class="input"
							placeholder="z.B. Hochzeitstag, Kennenlerndatum"
						/>
					</div>
					<div class="form-field custom-date-date-field">
						<label for="custom-date-{customDate.id}" class="label">Datum</label>
						<input
							id="custom-date-{customDate.id}"
							type="date"
							value={customDate.date}
							oninput={(e) => updateCustomDate(customDate.id, 'date', e.currentTarget.value)}
							class="input"
						/>
					</div>
					<button
						type="button"
						class="remove-button"
						onclick={() => removeCustomDate(customDate.id)}
						aria-label="Datum entfernen"
					>
						<Trash size={18} />
					</button>
				</div>
			{/each}

			<!-- Add button -->
			<button type="button" class="add-button" onclick={addCustomDate}>
				<Plus size={16} />
				Datum hinzufügen
			</button>
		</div>
	{/if}
</section>

<style>
	.form-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.25rem;
	}

	.section-header-toggle {
		cursor: pointer;
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		padding: 0;
		border-bottom: none;
		margin-bottom: 0;
	}

	.section-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.section-icon svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.section-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		flex: 1;
	}

	.chevron-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.chevron-open {
		transform: rotate(180deg);
	}

	.dates-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.birthday-field {
		padding-bottom: 1rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.3);
	}

	.label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.date-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.date-icon-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}

	.date-icon-label svg {
		width: 0.875rem;
		height: 0.875rem;
	}

	.custom-date-row {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 0.75rem;
		align-items: end;
	}

	@media (max-width: 480px) {
		.custom-date-row {
			grid-template-columns: 1fr auto;
		}

		.custom-date-label-field {
			grid-column: 1 / -1;
		}
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.6);
	}

	.remove-button {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-destructive) / 0.1);
		color: hsl(var(--color-destructive));
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.remove-button:hover {
		background: hsl(var(--color-destructive) / 0.2);
	}

	.remove-button svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1.5px dashed hsl(var(--color-border));
		border-radius: 0.625rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.05);
	}

	.add-button svg {
		width: 1rem;
		height: 1rem;
	}
</style>
