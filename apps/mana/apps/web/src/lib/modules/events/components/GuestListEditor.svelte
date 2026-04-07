<script lang="ts">
	import { eventGuestsStore } from '../stores/guests.svelte';
	import { useEventGuests } from '../queries';
	import type { RsvpStatus } from '../types';

	interface Props {
		eventId: string;
	}

	let { eventId }: Props = $props();

	const guests = useEventGuests(() => eventId);

	let newName = $state('');
	let newEmail = $state('');

	const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
		{ value: 'pending', label: 'Offen' },
		{ value: 'yes', label: 'Ja' },
		{ value: 'maybe', label: 'Vielleicht' },
		{ value: 'no', label: 'Nein' },
	];

	async function handleAdd(e: SubmitEvent) {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		await eventGuestsStore.addGuest({
			eventId,
			name,
			email: newEmail.trim() || null,
		});
		newName = '';
		newEmail = '';
	}
</script>

<div class="guest-editor">
	<form class="add-row" onsubmit={handleAdd}>
		<input type="text" bind:value={newName} placeholder="Name" class="input name-input" required />
		<input
			type="email"
			bind:value={newEmail}
			placeholder="E-Mail (optional)"
			class="input email-input"
		/>
		<button type="submit" class="add-btn">Hinzufügen</button>
	</form>

	<ul class="guest-list">
		{#each guests.value ?? [] as guest (guest.id)}
			<li class="guest-row">
				<div class="guest-info">
					<div class="guest-name">{guest.name}</div>
					{#if guest.email}
						<div class="guest-email">{guest.email}</div>
					{/if}
				</div>

				<div class="guest-controls">
					<select
						class="rsvp-select"
						value={guest.rsvpStatus}
						onchange={(e) =>
							eventGuestsStore.setRsvp(guest.id, e.currentTarget.value as RsvpStatus)}
					>
						{#each RSVP_OPTIONS as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>

					<label class="plus-ones">
						+
						<input
							type="number"
							min="0"
							max="20"
							value={guest.plusOnes}
							onchange={(e) =>
								eventGuestsStore.updateGuest(guest.id, {
									plusOnes: Number(e.currentTarget.value) || 0,
								})}
						/>
					</label>

					<button
						class="remove-btn"
						onclick={() => eventGuestsStore.deleteGuest(guest.id)}
						title="Entfernen"
					>
						×
					</button>
				</div>
			</li>
		{/each}

		{#if (guests.value ?? []).length === 0}
			<li class="empty">Noch keine Gäste hinzugefügt.</li>
		{/if}
	</ul>
</div>

<style>
	.guest-editor {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.add-row {
		display: flex;
		gap: 0.5rem;
	}
	.input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}
	.email-input {
		flex: 1.2;
	}
	.add-btn {
		padding: 0.5rem 0.875rem;
		border-radius: 0.5rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.guest-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.guest-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
	}
	.guest-info {
		flex: 1;
		min-width: 0;
	}
	.guest-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.guest-email {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.guest-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.rsvp-select {
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
	}
	.plus-ones {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.plus-ones input {
		width: 2.5rem;
		padding: 0.25rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		background: hsl(var(--color-background));
		font-size: 0.75rem;
		text-align: center;
	}
	.remove-btn {
		padding: 0.125rem 0.5rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
		border-radius: 0.25rem;
	}
	.remove-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
	.empty {
		padding: 1rem;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
