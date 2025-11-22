<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props {
		type?: 'text' | 'email' | 'password' | 'number' | 'search';
		value?: string;
		placeholder?: string;
		label?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
		class?: string;
		id?: string;
	}

	let {
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		label,
		error,
		disabled = false,
		required = false,
		autocomplete,
		oninput,
		class: className = '',
		id
	}: Props = $props();

	// Generate unique ID if not provided
	const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

	const inputClasses = `
		flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
		ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
		placeholder:text-muted-foreground
		focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
		disabled:cursor-not-allowed disabled:opacity-50
		${error ? 'border-destructive' : ''}
		${className}
	`;
</script>

<div class="space-y-2">
	{#if label}
		<label for={inputId} class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
			{label}
			{#if required}
				<span class="text-destructive">*</span>
			{/if}
		</label>
	{/if}

	<input
		id={inputId}
		{type}
		bind:value
		{placeholder}
		{disabled}
		{required}
		autocomplete={autocomplete}
		{oninput}
		class={inputClasses}
	/>

	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>
