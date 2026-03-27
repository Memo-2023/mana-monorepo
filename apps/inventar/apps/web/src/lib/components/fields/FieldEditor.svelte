<script lang="ts">
	import type { FieldDefinition } from '@inventar/shared';

	interface Props {
		field: FieldDefinition;
		value: unknown;
		onchange: (value: unknown) => void;
	}

	let { field, value, onchange }: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		switch (field.type) {
			case 'number':
			case 'currency':
				onchange(target.value ? Number(target.value) : undefined);
				break;
			case 'checkbox':
				onchange(target.checked);
				break;
			default:
				onchange(target.value || undefined);
		}
	}

	function handleSelectChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onchange(target.value || undefined);
	}

	const inputClass =
		'w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1';
</script>

{#if field.type === 'text'}
	<input
		type="text"
		value={String(value || '')}
		placeholder={field.placeholder || field.name}
		class={inputClass}
		oninput={handleInput}
	/>
{:else if field.type === 'number'}
	<input
		type="number"
		value={value !== undefined && value !== null ? Number(value) : ''}
		placeholder={field.placeholder || field.name}
		class={inputClass}
		oninput={handleInput}
	/>
{:else if field.type === 'currency'}
	<div class="flex gap-2">
		<input
			type="number"
			step="0.01"
			value={value !== undefined && value !== null ? Number(value) : ''}
			placeholder="0.00"
			class="{inputClass} flex-1"
			oninput={handleInput}
		/>
		<span class="flex items-center text-sm text-[hsl(var(--muted-foreground))]">
			{field.currencyCode || 'EUR'}
		</span>
	</div>
{:else if field.type === 'date'}
	<input type="date" value={String(value || '')} class={inputClass} oninput={handleInput} />
{:else if field.type === 'checkbox'}
	<label class="flex cursor-pointer items-center gap-2">
		<input
			type="checkbox"
			checked={!!value}
			class="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
			onchange={handleInput}
		/>
		<span class="text-sm text-[hsl(var(--foreground))]">{field.name}</span>
	</label>
{:else if field.type === 'select'}
	<select value={String(value || '')} class={inputClass} onchange={handleSelectChange}>
		<option value="">— Auswahlen —</option>
		{#each field.options || [] as option}
			<option value={option}>{option}</option>
		{/each}
	</select>
{:else if field.type === 'url'}
	<input
		type="url"
		value={String(value || '')}
		placeholder={field.placeholder || 'https://...'}
		class={inputClass}
		oninput={handleInput}
	/>
{:else if field.type === 'tags'}
	{@const currentTags = Array.isArray(value) ? (value as string[]) : []}
	<div class="space-y-2">
		<div class="flex flex-wrap gap-1">
			{#each currentTags as tag, i}
				<span
					class="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs"
				>
					{tag}
					<button
						type="button"
						class="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
						onclick={() => onchange(currentTags.filter((_, idx) => idx !== i))}>x</button
					>
				</span>
			{/each}
		</div>
		<input
			type="text"
			placeholder="Tag eingeben + Enter"
			class={inputClass}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					const target = e.target as HTMLInputElement;
					const newTag = target.value.trim();
					if (newTag && !currentTags.includes(newTag)) {
						onchange([...currentTags, newTag]);
						target.value = '';
					}
				}
			}}
		/>
	</div>
{/if}
