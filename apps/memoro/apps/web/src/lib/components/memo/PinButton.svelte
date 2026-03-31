<script lang="ts">
	interface Props {
		isPinned: boolean;
		onToggle?: () => void;
		size?: 'sm' | 'md' | 'lg';
	}

	let { isPinned, onToggle, size = 'md' }: Props = $props();

	const sizeClasses = {
		sm: 'h-6 w-6',
		md: 'h-8 w-8',
		lg: 'h-10 w-10',
	};

	const iconSizeClasses = {
		sm: 'h-3 w-3',
		md: 'h-4 w-4',
		lg: 'h-5 w-5',
	};
</script>

<button
	onclick={onToggle}
	class="flex items-center justify-center rounded-full transition-all {sizeClasses[size]} {isPinned
		? 'bg-primary text-white hover:bg-primary-dark'
		: 'bg-menu hover:bg-menu-hover text-theme-secondary'}"
	title={isPinned ? 'Unpin memo' : 'Pin memo'}
	aria-label={isPinned ? 'Unpin memo' : 'Pin memo'}
>
	<svg
		class="{iconSizeClasses[size]} transition-transform {isPinned ? 'rotate-45' : ''}"
		fill={isPinned ? 'currentColor' : 'none'}
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
		/>
	</svg>
</button>
