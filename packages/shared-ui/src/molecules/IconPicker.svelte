<!--
  IconPicker — reusable Phosphor icon picker with search and categories.
  Follows the same pattern as ColorPicker (size variants, a11y, Tailwind).
-->
<script lang="ts">
	import { ICON_CATEGORIES, getIconComponent, type IconName } from '@manacore/shared-icons';
	import { Check } from '@manacore/shared-icons';

	interface Props {
		selectedIcon?: string;
		onIconChange: (icon: string) => void;
		size?: 'sm' | 'md' | 'lg';
		label?: string;
		showSearch?: boolean;
		showCategories?: boolean;
	}

	let {
		selectedIcon,
		onIconChange,
		size = 'md',
		label = 'Icon wählen',
		showSearch = true,
		showCategories = true,
	}: Props = $props();

	let searchQuery = $state('');

	const sizeClasses: Record<string, string> = {
		sm: 'w-8 h-8',
		md: 'w-10 h-10',
		lg: 'w-12 h-12',
	};

	const iconSizes: Record<string, number> = {
		sm: 16,
		md: 20,
		lg: 24,
	};

	const checkSizes: Record<string, number> = {
		sm: 8,
		md: 10,
		lg: 12,
	};

	const gapClasses: Record<string, string> = {
		sm: 'gap-1',
		md: 'gap-1.5',
		lg: 'gap-2',
	};

	let filteredCategories = $derived.by(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return ICON_CATEGORIES;

		const result: Record<string, string[]> = {};
		for (const [category, icons] of Object.entries(ICON_CATEGORIES)) {
			const matched = icons.filter((name) => name.includes(query));
			if (matched.length > 0) {
				result[category] = matched;
			}
		}
		return result;
	});

	function handleKeyDown(e: KeyboardEvent, iconName: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onIconChange(iconName);
		}
	}
</script>

<div class="flex flex-col gap-2" role="group" aria-label={label}>
	{#if showSearch}
		<input
			type="text"
			class="w-full rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-sm
				text-[var(--color-foreground,#fff)] placeholder-[var(--color-muted-foreground,#888)]
				outline-none focus:border-[var(--color-primary,#6366f1)]"
			placeholder="Icon suchen..."
			bind:value={searchQuery}
		/>
	{/if}

	{#each Object.entries(filteredCategories) as [category, icons]}
		<div>
			{#if showCategories}
				<div
					class="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground,#888)]"
				>
					{category}
				</div>
			{/if}
			<div class="flex flex-wrap {gapClasses[size]}" role="radiogroup" aria-label={category}>
				{#each icons as iconName}
					{@const isSelected = selectedIcon === iconName}
					{@const IconComp = getIconComponent(iconName)}
					{#if IconComp}
						<button
							type="button"
							class="
								{sizeClasses[size]}
								relative rounded-lg
								flex items-center justify-center
								transition-all duration-150
								focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#6366f1)]
								{isSelected
								? 'bg-[var(--color-primary,#6366f1)]/20 ring-2 ring-[var(--color-primary,#6366f1)] scale-110'
								: 'bg-white/5 hover:bg-white/10 hover:scale-110'}
							"
							onclick={() => onIconChange(iconName)}
							onkeydown={(e) => handleKeyDown(e, iconName)}
							role="radio"
							aria-checked={isSelected}
							aria-label={iconName}
							title={iconName}
						>
							<IconComp
								size={iconSizes[size]}
								weight={isSelected ? 'bold' : 'regular'}
								class="text-[var(--color-foreground,#fff)]"
							/>
							{#if isSelected}
								<div
									class="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center
										rounded-full bg-[var(--color-primary,#6366f1)]"
								>
									<Check size={checkSizes[size]} weight="bold" class="text-white" />
								</div>
							{/if}
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/each}

	{#if Object.keys(filteredCategories).length === 0}
		<p class="py-2 text-center text-sm text-[var(--color-muted-foreground,#888)]">
			Kein Icon gefunden
		</p>
	{/if}
</div>
