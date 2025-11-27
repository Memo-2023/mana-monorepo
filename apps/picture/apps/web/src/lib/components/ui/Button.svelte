<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		class: className = '',
		onclick,
		children,
	}: Props = $props();

	const baseStyles =
		'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variants = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
		secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400',
		outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-400',
		ghost: 'hover:bg-gray-100 focus-visible:ring-gray-400',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
	};

	const sizes = {
		sm: 'h-9 px-3 text-sm rounded-md',
		md: 'h-10 px-4 py-2 rounded-md',
		lg: 'h-11 px-8 text-lg rounded-md',
	};

	const buttonClass = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
</script>

<button {type} class={buttonClass} disabled={disabled || loading} {onclick}>
	{#if loading}
		<svg
			class="mr-2 h-4 w-4 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{@render children()}
</button>
