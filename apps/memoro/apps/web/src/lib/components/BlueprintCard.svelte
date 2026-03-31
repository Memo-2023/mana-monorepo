<script lang="ts">
	interface Category {
		id: string;
		name: { de?: string; en?: string } | string;
		style?: { color?: string } | string;
	}

	interface Props {
		id: string;
		name: { de?: string; en?: string };
		description?: { de?: string; en?: string };
		category?: Category;
		isPublic: boolean;
		createdAt: string;
		onPress: (id: string) => void;
		showCategory?: boolean;
		isActive?: boolean;
		onToggleActive?: (id: string) => Promise<void>;
	}

	let {
		id,
		name,
		description,
		category,
		isPublic,
		createdAt,
		onPress,
		showCategory = false,
		isActive = false,
		onToggleActive,
	}: Props = $props();

	// Get current language (simplified, you can use i18n store later)
	const lang = 'de'; // or get from i18n store

	const displayName = $derived(name?.[lang] || name?.en || name?.de || 'Unnamed Blueprint');
	const displayDescription = $derived(
		description?.[lang] || description?.en || description?.de || ''
	);

	// Parse category name and color
	let categoryName = $state('');
	let categoryColor = $state('#808080');

	$effect(() => {
		if (category) {
			// Parse category name
			if (category.name) {
				if (typeof category.name === 'string') {
					try {
						const nameObj = JSON.parse(category.name);
						categoryName = nameObj[lang] || nameObj.en || nameObj.de || '';
					} catch (e) {
						categoryName = category.name;
					}
				} else {
					categoryName = category.name[lang] || category.name.en || category.name.de || '';
				}
			}

			// Parse category color
			if (category.style) {
				if (typeof category.style === 'string') {
					try {
						const styleObj = JSON.parse(category.style);
						categoryColor = styleObj.color || '#808080';
					} catch (e) {
						categoryColor = '#808080';
					}
				} else {
					categoryColor = category.style.color || '#808080';
				}
			}

			// Validate color format
			if (!categoryColor.startsWith('#')) {
				categoryColor = '#808080';
			}
		}
	});

	let isLoading = $state(false);

	async function handleToggleActive(event: MouseEvent) {
		event.stopPropagation();
		if (onToggleActive && !isLoading) {
			isLoading = true;
			try {
				await onToggleActive(id);
			} finally {
				isLoading = false;
			}
		}
	}

	function handleCardClick() {
		onPress(id);
	}
</script>

<div
	onclick={handleCardClick}
	class="w-full cursor-pointer rounded-2xl border border-theme bg-content p-4 text-left transition-colors hover:bg-content-hover"
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleCardClick();
		}
	}}
>
	<!-- Header -->
	<div class="mb-2 flex items-center justify-between">
		<h3 class="mr-2 flex-1 truncate text-lg font-bold text-theme">{displayName}</h3>
		<div class="flex items-center gap-3">
			<!-- Pin Button -->
			<button
				onclick={handleToggleActive}
				class="rounded-lg p-2 transition-colors"
				style="background-color: {isActive
					? 'rgba(255, 149, 0, 0.15)'
					: 'rgba(128, 128, 128, 0.1)'}"
				disabled={isLoading}
			>
				{#if isLoading}
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
					></div>
				{:else}
					<svg
						class="h-5 w-5"
						fill={isActive ? 'currentColor' : 'none'}
						viewBox="0 0 24 24"
						stroke="currentColor"
						style="color: {isActive ? '#FF9500' : 'currentColor'}"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Description -->
	{#if displayDescription}
		<p class="mb-2 line-clamp-2 text-sm text-theme-secondary">
			{displayDescription}
		</p>
	{/if}

	<!-- Category Tag -->
	{#if showCategory && category && categoryName}
		<div class="mt-1 flex">
			<span
				class="rounded-lg border px-2.5 py-1 text-xs font-semibold"
				style="background-color: {categoryColor}33; border-color: {categoryColor}; color: {categoryColor}"
			>
				{categoryName}
			</span>
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
