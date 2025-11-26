<script lang="ts">
	import type { Character } from '$lib/types/character';
	import { isSystemCharacter } from '$lib/types/character';

	interface Props {
		character: Character;
		size?: 'sm' | 'md' | 'lg';
		showName?: boolean;
	}

	let { character, size = 'md', showName = true }: Props = $props();

	// Size classes
	const sizeClasses = {
		sm: 'h-16 w-16',
		md: 'h-24 w-24',
		lg: 'h-32 w-32',
	};

	const textSizeClasses = {
		sm: 'text-xs',
		md: 'text-xs',
		lg: 'text-sm',
	};

	// Get image URL
	let imageUrl = $derived(character.imageUrl || character.image_url || '/images/placeholder-character.png');

	// Check if system character
	let isSystem = $derived(isSystemCharacter(character));
</script>

<a
	href="/characters/{character.id}"
	class="group flex flex-shrink-0 flex-col items-center gap-2 text-center"
>
	<!-- Avatar -->
	<div class="relative">
		<div
			class="{sizeClasses[size]} overflow-hidden rounded-full border-3 border-white bg-gradient-to-br from-pink-200 to-purple-200 shadow-md transition-all group-hover:shadow-lg group-hover:scale-105 dark:border-gray-700 dark:from-pink-900/30 dark:to-purple-900/30"
		>
			<img
				src={imageUrl}
				alt={character.name}
				class="h-full w-full object-cover"
				loading="lazy"
			/>
		</div>

		<!-- System Character Badge -->
		{#if isSystem}
			<div
				class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md"
				title="System-Charakter"
			>
				<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
					<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
				</svg>
			</div>
		{/if}
	</div>

	<!-- Name -->
	{#if showName}
		<span
			class="{textSizeClasses[size]} max-w-[80px] truncate font-medium text-gray-700 group-hover:text-pink-600 dark:text-gray-300 dark:group-hover:text-pink-400"
		>
			{character.name}
		</span>
	{/if}
</a>
