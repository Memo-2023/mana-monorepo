<script lang="ts">
	interface Props {
		type?: string;
		name?: string;
		id?: string;
		placeholder?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		autocomplete?: 'email' | 'current-password' | 'new-password' | 'username' | 'off' | string;
		oninput?: (event: Event) => void;
	}

	let {
		type = 'text',
		name,
		id,
		placeholder,
		value = $bindable(''),
		required = false,
		disabled = false,
		class: className = '',
		autocomplete,
		oninput
	}: Props = $props();
</script>

<input
	{type}
	{name}
	{id}
	{placeholder}
	{required}
	{disabled}
	autocomplete={autocomplete as any}
	bind:value
	oninput={oninput}
	class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 {className}"
/>
