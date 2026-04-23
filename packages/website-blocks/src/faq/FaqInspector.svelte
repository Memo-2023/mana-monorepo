<script lang="ts">
	import type { BlockInspectorProps } from '../types';
	import type { FaqProps, FaqItem } from './schema';

	let { block, onChange }: BlockInspectorProps<FaqProps> = $props();

	function updateItem(index: number, patch: Partial<FaqItem>) {
		const next = block.props.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
		onChange({ items: next });
	}

	function addItem() {
		onChange({ items: [...block.props.items, { question: 'Neue Frage', answer: 'Die Antwort.' }] });
	}

	function removeItem(index: number) {
		onChange({ items: block.props.items.filter((_, i) => i !== index) });
	}

	function moveItem(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= block.props.items.length) return;
		const next = [...block.props.items];
		[next[index], next[target]] = [next[target], next[index]];
		onChange({ items: next });
	}
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>Überschrift</span>
		<input
			type="text"
			value={block.props.title}
			oninput={(e) => onChange({ title: e.currentTarget.value })}
		/>
	</label>

	<label class="wb-checkbox">
		<input
			type="checkbox"
			checked={block.props.defaultOpen}
			onchange={(e) => onChange({ defaultOpen: e.currentTarget.checked })}
		/>
		<span>Alle standardmäßig ausgeklappt</span>
	</label>

	<div class="wb-items">
		<div class="wb-items__header">
			<span>Fragen ({block.props.items.length})</span>
			<button class="wb-btn wb-btn--primary" onclick={addItem}>+ Frage</button>
		</div>

		{#each block.props.items as item, i (i)}
			<div class="wb-item">
				<div class="wb-item__head">
					<span class="wb-item__index">#{i + 1}</span>
					<div class="wb-item__actions">
						<button
							class="wb-btn wb-btn--icon"
							onclick={() => moveItem(i, -1)}
							disabled={i === 0}
							title="Nach oben">↑</button
						>
						<button
							class="wb-btn wb-btn--icon"
							onclick={() => moveItem(i, 1)}
							disabled={i === block.props.items.length - 1}
							title="Nach unten">↓</button
						>
						<button
							class="wb-btn wb-btn--icon wb-btn--danger"
							onclick={() => removeItem(i)}
							title="Löschen">×</button
						>
					</div>
				</div>
				<input
					type="text"
					value={item.question}
					oninput={(e) => updateItem(i, { question: e.currentTarget.value })}
					placeholder="Frage"
				/>
				<textarea
					rows="3"
					value={item.answer}
					oninput={(e) => updateItem(i, { answer: e.currentTarget.value })}
					placeholder="Antwort"
				></textarea>
			</div>
		{/each}
	</div>
</div>

<style>
	.wb-inspector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-field,
	.wb-checkbox {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-checkbox {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}
	.wb-field > span {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-field input,
	.wb-item input,
	.wb-item textarea {
		width: 100%;
		padding: 0.4rem 0.6rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-family: inherit;
		font-size: 0.8125rem;
	}
	.wb-item textarea {
		resize: vertical;
		min-height: 3.5rem;
	}
	.wb-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-items__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-item {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.5rem;
	}
	.wb-item__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.wb-item__index {
		font-size: 0.7rem;
		opacity: 0.5;
	}
	.wb-item__actions {
		display: flex;
		gap: 0.25rem;
	}
	.wb-btn {
		padding: 0.3rem 0.65rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.75rem;
		cursor: pointer;
		font-weight: 500;
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.85);
		color: white;
	}
	.wb-btn--icon {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: inherit;
		width: 1.75rem;
		padding: 0;
		line-height: 1.3;
	}
	.wb-btn--icon:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.06);
	}
	.wb-btn--danger:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.4);
		color: rgb(248, 113, 113);
	}
	.wb-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
