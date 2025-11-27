<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		value?: string;
		placeholder?: string;
		label?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		id?: string;
		name?: string;
		autocomplete?: string;
		onchange?: (e: Event) => void;
		oninput?: (e: Event) => void;
	}

	let {
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		label = '',
		error = '',
		disabled = false,
		required = false,
		class: className = '',
		id = '',
		name = '',
		autocomplete = '',
		onchange,
		oninput,
	}: Props = $props();

	const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

	const baseStyles =
		'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

	const errorStyles = error ? 'border-red-500 focus:ring-red-600' : '';

	const inputClass = `${baseStyles} ${errorStyles} ${className}`;
</script>

{#if label}
	<label for={inputId} class="mb-2 block text-sm font-medium text-gray-700">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>
{/if}

<input
	{type}
	bind:value
	{placeholder}
	{disabled}
	{required}
	{name}
	{autocomplete}
	id={inputId}
	class={inputClass}
	{onchange}
	{oninput}
/>

{#if error}
	<p class="mt-1 text-sm text-red-600">{error}</p>
{/if}
