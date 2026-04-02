<script lang="ts">
	import { getContext } from 'svelte';
	import type { Observable } from 'dexie';
	import type { LocalLabel } from '../../types';
	import { X, Plus, Tag } from '@manacore/shared-icons';

	interface Props {
		selectedIds: string[];
		onChange: (ids: string[]) => void;
	}

	let { selectedIds, onChange }: Props = $props();

	const allLabels$: Observable<LocalLabel[]> = getContext('labels');
	let allLabels = $state<LocalLabel[]>([]);
	$effect(() => {
		const sub = allLabels$.subscribe((l) => (allLabels = l));
		return () => sub.unsubscribe();
	});

	let showPicker = $state(false);

	function toggle(id: string) {
		if (selectedIds.includes(id)) {
			onChange(selectedIds.filter((i) => i !== id));
		} else {
			onChange([...selectedIds, id]);
		}
	}

	let selectedLabels = $derived(
		selectedIds
			.map((id) => allLabels.find((l) => l.id === id))
			.filter((l): l is LocalLabel => l != null)
	);

	let availableLabels = $derived(allLabels.filter((l) => !selectedIds.includes(l.id)));
</script>

<div class="flex flex-wrap items-center gap-1">
	{#each selectedLabels as label (label.id)}
		<span
			class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium"
			style="background: color-mix(in srgb, {label.color} 15%, transparent); color: {label.color}"
		>
			{label.name}
			<button type="button" onclick={() => toggle(label.id)} class="hover:opacity-70">
				<X size={10} />
			</button>
		</span>
	{/each}

	<div class="relative">
		<button
			type="button"
			onclick={() => (showPicker = !showPicker)}
			class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
		>
			<Tag size={12} />
			<Plus size={10} />
		</button>

		{#if showPicker && availableLabels.length > 0}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
				onclick|stopPropagation
			>
				{#each availableLabels as label (label.id)}
					<button
						type="button"
						onclick={() => {
							toggle(label.id);
							if (availableLabels.length <= 1) showPicker = false;
						}}
						class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
					>
						<span class="h-2.5 w-2.5 rounded-full" style="background-color: {label.color}"></span>
						{label.name}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if showPicker}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40" onclick={() => (showPicker = false)}></div>
{/if}
