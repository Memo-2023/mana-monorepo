<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useEventItems, useEventGuests } from '../queries';
	import { eventItemsStore } from '../stores/items.svelte';
	import { eventsStore } from '../stores/events.svelte';
	import type { EventItem } from '../types';

	interface Props {
		eventId: string;
	}

	let { eventId }: Props = $props();

	const items = useEventItems(() => eventId);
	const guests = useEventGuests(() => eventId);

	let newLabel = $state('');
	let newQuantity = $state<number | undefined>(undefined);

	const guestNameById = $derived(new Map((guests.value ?? []).map((g) => [g.id, g.name])));

	function assigneeLabel(item: EventItem): string | null {
		if (item.assignedGuestId) {
			return (
				guestNameById.get(item.assignedGuestId) ?? $_('events.bring_list_editor.unknown_assignee')
			);
		}
		if (item.claimedByName) {
			return $_('events.bring_list_editor.claimed_via_link', {
				values: { name: item.claimedByName },
			});
		}
		return null;
	}

	async function handleAdd(e: SubmitEvent) {
		e.preventDefault();
		const label = newLabel.trim();
		if (!label) return;
		await eventItemsStore.addItem({
			eventId,
			label,
			quantity: newQuantity ?? null,
		});
		// Snapshot pushed afterwards so the public bring list reflects the
		// addition immediately for already-published events.
		void eventsStore.syncSnapshotIfPublished(eventId);
		newLabel = '';
		newQuantity = undefined;
	}
</script>

<div class="bring-editor">
	<form class="add-row" onsubmit={handleAdd}>
		<input
			type="text"
			bind:value={newLabel}
			placeholder={$_('events.bring_list_editor.placeholder_label')}
			class="input label-input"
			required
		/>
		<input
			type="number"
			min="1"
			max="999"
			placeholder={$_('events.bring_list_editor.placeholder_quantity')}
			bind:value={newQuantity}
			class="input qty-input"
		/>
		<button type="submit" class="add-btn">{$_('events.bring_list_editor.action_add')}</button>
	</form>

	<ul class="item-list">
		{#each items.value ?? [] as item (item.id)}
			{@const assignee = assigneeLabel(item)}
			<li class="item-row" class:done={item.done}>
				<label class="check">
					<input
						type="checkbox"
						checked={item.done}
						onchange={(e) => eventItemsStore.toggleDone(item.id, e.currentTarget.checked)}
					/>
				</label>

				<div class="info">
					<div class="label-row">
						<span class="label">{item.label}</span>
						{#if item.quantity}
							<span class="qty">×{item.quantity}</span>
						{/if}
					</div>
					{#if assignee}
						<div class="assignee">→ {assignee}</div>
					{/if}
				</div>

				<select
					class="assign-select"
					value={item.assignedGuestId ?? ''}
					onchange={(e) => eventItemsStore.assign(item.id, e.currentTarget.value || null)}
				>
					<option value="">{$_('events.bring_list_editor.option_no_one')}</option>
					{#each guests.value ?? [] as g (g.id)}
						<option value={g.id}>{g.name}</option>
					{/each}
				</select>

				<button
					class="remove-btn"
					onclick={() => eventItemsStore.deleteItem(item.id)}
					title={$_('events.bring_list_editor.action_remove_title')}
				>
					×
				</button>
			</li>
		{/each}

		{#if (items.value ?? []).length === 0}
			<li class="empty">{$_('events.bring_list_editor.empty')}</li>
		{/if}
	</ul>
</div>

<style>
	.bring-editor {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.add-row {
		display: flex;
		gap: 0.5rem;
	}
	.input {
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}
	.label-input {
		flex: 1;
	}
	.qty-input {
		width: 5rem;
	}
	.add-btn {
		padding: 0.5rem 0.875rem;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.item-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.item-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
	}
	.item-row.done .label {
		text-decoration: line-through;
		color: hsl(var(--color-muted-foreground));
	}
	.check input {
		width: 1rem;
		height: 1rem;
		accent-color: hsl(var(--color-primary));
	}
	.info {
		flex: 1;
		min-width: 0;
	}
	.label-row {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}
	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}
	.qty {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.assignee {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}
	.assign-select {
		max-width: 9rem;
		padding: 0.25rem 0.375rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
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
