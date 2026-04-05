<script lang="ts">
	import { User } from '@mana/shared-icons';

	interface Props {
		/** Photo URL */
		photoUrl?: string | null;
		/** Display name (for initials fallback) */
		name?: string;
		/** Size in pixels */
		size?: 'xs' | 'sm' | 'md' | 'lg';
		/** Custom class */
		class?: string;
	}

	let { photoUrl, name = '', size = 'md', class: className = '' }: Props = $props();

	const sizeClasses = {
		xs: 'w-5 h-5 text-[10px]',
		sm: 'w-6 h-6 text-xs',
		md: 'w-8 h-8 text-sm',
		lg: 'w-10 h-10 text-base',
	};

	const iconSizes = {
		xs: 10,
		sm: 12,
		md: 16,
		lg: 20,
	};

	// Generate initials from name
	const initials = $derived.by(() => {
		if (!name) return '';
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) {
			return parts[0].charAt(0).toUpperCase();
		}
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	});

	// Generate a consistent background color based on the name
	const bgColor = $derived.by(() => {
		if (!name) return 'bg-gray-400';
		const colors = [
			'bg-violet-500',
			'bg-blue-500',
			'bg-cyan-500',
			'bg-teal-500',
			'bg-green-500',
			'bg-amber-500',
			'bg-orange-500',
			'bg-rose-500',
			'bg-pink-500',
			'bg-indigo-500',
		];
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		return colors[Math.abs(hash) % colors.length];
	});
</script>

{#if photoUrl}
	<img
		src={photoUrl}
		alt={name || 'Kontakt'}
		class="
			{sizeClasses[size]}
			rounded-full object-cover
			{className}
		"
	/>
{:else if initials}
	<div
		class="
			{sizeClasses[size]}
			{bgColor}
			rounded-full
			flex items-center justify-center
			text-white font-medium
			{className}
		"
	>
		{initials}
	</div>
{:else}
	<div
		class="
			{sizeClasses[size]}
			bg-gray-300 dark:bg-gray-600
			rounded-full
			flex items-center justify-center
			text-gray-500 dark:text-gray-400
			{className}
		"
	>
		<User size={iconSizes[size]} />
	</div>
{/if}
