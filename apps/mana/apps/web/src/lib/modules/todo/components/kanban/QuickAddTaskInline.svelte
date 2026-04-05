<script lang="ts">
	import { Plus } from '@mana/shared-icons';

	interface Props {
		onAdd: (title: string) => void;
		placeholder?: string;
	}

	let { onAdd, placeholder = 'Aufgabe hinzufügen...' }: Props = $props();

	let active = $state(false);
	let title = $state('');
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	function activate() {
		active = true;
		requestAnimationFrame(() => inputEl?.focus());
	}

	function submit() {
		const text = title.trim();
		if (text) {
			onAdd(text);
			title = '';
		}
		// Keep active for rapid entry
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submit();
		} else if (e.key === 'Escape') {
			active = false;
			title = '';
		}
	}

	function handleBlur() {
		if (title.trim()) {
			submit();
		}
		active = false;
	}
</script>

<div class="mt-1">
	{#if !active}
		<button
			onclick={activate}
			class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
		>
			<span
				class="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-current opacity-50"
			>
				<Plus size={12} />
			</span>
			<span class="opacity-60">{placeholder}</span>
		</button>
	{:else}
		<div class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5">
			<span
				class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
			>
				<Plus size={12} />
			</span>
			<input
				bind:this={inputEl}
				bind:value={title}
				onkeydown={handleKeydown}
				onblur={handleBlur}
				{placeholder}
				class="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
			/>
		</div>
	{/if}
</div>
