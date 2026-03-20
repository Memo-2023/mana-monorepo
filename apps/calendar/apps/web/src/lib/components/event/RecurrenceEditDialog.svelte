<script lang="ts">
	import { Modal } from '@manacore/shared-ui';

	type RecurrenceAction = 'this' | 'all' | 'this_and_future';

	interface Props {
		visible: boolean;
		mode: 'edit' | 'delete';
		onSelect: (action: RecurrenceAction) => void;
		onCancel: () => void;
	}

	let { visible, mode, onSelect, onCancel }: Props = $props();

	const title = $derived(
		mode === 'edit' ? 'Wiederkehrenden Termin bearbeiten' : 'Wiederkehrenden Termin löschen'
	);
</script>

<Modal {visible} onClose={onCancel} {title} maxWidth="sm">
	<div class="options">
		<button class="option-btn" onclick={() => onSelect('this')}>
			<span class="option-title">
				{mode === 'edit' ? 'Nur diesen Termin' : 'Nur diesen Termin löschen'}
			</span>
			<span class="option-desc">Andere Wiederholungen bleiben unverändert</span>
		</button>

		<button class="option-btn" onclick={() => onSelect('this_and_future')}>
			<span class="option-title">
				{mode === 'edit' ? 'Diesen und alle zukünftigen' : 'Diesen und alle zukünftigen löschen'}
			</span>
			<span class="option-desc">Vergangene Wiederholungen bleiben erhalten</span>
		</button>

		<button class="option-btn" onclick={() => onSelect('all')}>
			<span class="option-title">
				{mode === 'edit' ? 'Alle Termine der Serie' : 'Alle Termine der Serie löschen'}
			</span>
			<span class="option-desc">Die gesamte Wiederholungsserie wird betroffen</span>
		</button>
	</div>

	{#snippet footer()}
		<div class="footer">
			<button class="cancel-btn" onclick={onCancel}>Abbrechen</button>
		</div>
	{/snippet}
</Modal>

<style>
	.options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.option-btn {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
		padding: 0.875rem 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--background));
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.option-btn:hover {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	.option-title {
		font-weight: 500;
		font-size: 0.9375rem;
		color: hsl(var(--foreground));
	}

	.option-desc {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.footer {
		display: flex;
		justify-content: flex-end;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.cancel-btn:hover {
		color: hsl(var(--foreground));
		background: hsl(var(--muted));
	}
</style>
