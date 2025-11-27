<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		value: string;
		oninput?: (value: string) => void;
		onchange?: (value: string) => void;
		label?: string;
		placeholder?: string;
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		error?: string;
		disabled?: boolean;
		required?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		class?: string;
		id?: string;
		name?: string;
	}

	let {
		value = $bindable(),
		oninput,
		onchange,
		label,
		placeholder,
		type = 'text',
		error,
		disabled = false,
		required = false,
		autocomplete,
		class: className = '',
		id = `input-${Math.random().toString(36).slice(2, 9)}`,
		name,
	}: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		oninput?.(target.value);
	}

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onchange?.(target.value);
	}
</script>

<div class="flex flex-col gap-1.5 {className}">
	{#if label}
		<label for={id} class="text-sm font-medium text-theme">
			{label}
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}

	<input
		{id}
		{name}
		{type}
		{value}
		{placeholder}
		{disabled}
		{required}
		autocomplete={autocomplete as HTMLInputAttributes['autocomplete']}
		oninput={handleInput}
		onchange={handleChange}
		class="w-full rounded-lg border px-4 py-2.5 text-theme bg-content transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed {error
			? 'border-red-500 focus:ring-red-500/50'
			: 'border-theme'}"
	/>

	{#if error}
		<p class="text-sm text-red-500">{error}</p>
	{/if}
</div>
