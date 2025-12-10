<script lang="ts">
	import type { CommunityTheme, ThemeColors } from '@manacore/shared-theme';
	import { Heart, DownloadSimple, Star, Crown } from '@manacore/shared-icons';

	interface Props {
		/** The community theme to display */
		theme: CommunityTheme;
		/** Current user's effective mode */
		effectiveMode?: 'light' | 'dark';
		/** Callback when theme is selected */
		onSelect?: (theme: CommunityTheme) => void;
		/** Callback when download is clicked */
		onDownload?: (theme: CommunityTheme) => void;
		/** Callback when favorite is toggled */
		onToggleFavorite?: (theme: CommunityTheme) => void;
		/** Callback when theme is rated */
		onRate?: (theme: CommunityTheme, rating: number) => void;
		/** Show download button */
		showDownload?: boolean;
		/** Show favorite button */
		showFavorite?: boolean;
	}

	let {
		theme,
		effectiveMode = 'light',
		onSelect,
		onDownload,
		onToggleFavorite,
		onRate,
		showDownload = true,
		showFavorite = true,
	}: Props = $props();

	// Get preview colors based on effective mode
	let previewColors = $derived(
		effectiveMode === 'dark' ? theme.darkColors : theme.lightColors
	) as ThemeColors;

	// Format download count
	function formatCount(count: number): string {
		if (count >= 1000000) {
			return `${(count / 1000000).toFixed(1)}M`;
		}
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}k`;
		}
		return String(count);
	}

	let hoverRating = $state<number | null>(null);

	function handleStarClick(rating: number) {
		onRate?.(theme, rating);
	}

	function handleStarHover(rating: number | null) {
		hoverRating = rating;
	}
</script>

<article
	class="bg-surface border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-border-strong hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
	{theme.isFeatured ? 'border-primary/30 bg-gradient-to-b from-primary/5 to-surface' : ''}"
	onclick={() => onSelect?.(theme)}
	onkeypress={(e) => e.key === 'Enter' && onSelect?.(theme)}
	role="button"
	tabindex="0"
>
	<!-- Color Preview -->
	<div class="flex h-12 relative">
		<div class="flex-1" style="background-color: hsl({previewColors.primary})"></div>
		<div class="flex-1" style="background-color: hsl({previewColors.background})"></div>
		<div class="flex-1" style="background-color: hsl({previewColors.surface})"></div>
		<div class="flex-1" style="background-color: hsl({previewColors.foreground})"></div>
		<div class="flex-1" style="background-color: hsl({previewColors.success})"></div>
		<div class="flex-1" style="background-color: hsl({previewColors.error})"></div>

		{#if theme.isFeatured}
			<div
				class="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-primary text-primary-foreground rounded shadow-md"
			>
				<Crown size={12} weight="fill" />
				Featured
			</div>
		{/if}
	</div>

	<!-- Card Content -->
	<div class="p-4 flex flex-col gap-3">
		<div class="flex items-start gap-3">
			<span class="text-2xl leading-none">{theme.emoji}</span>
			<div class="flex-1 min-w-0">
				<h3 class="text-base font-semibold text-foreground truncate m-0">{theme.name}</h3>
				{#if theme.authorName}
					<span class="text-xs text-muted-foreground">von {theme.authorName}</span>
				{/if}
			</div>
		</div>

		{#if theme.description}
			<p class="text-sm text-muted-foreground line-clamp-2 m-0">{theme.description}</p>
		{/if}

		<!-- Tags -->
		{#if theme.tags.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each theme.tags.slice(0, 3) as tag}
					<span class="px-2 py-1 text-[10px] font-medium bg-muted text-muted-foreground rounded"
						>{tag}</span
					>
				{/each}
				{#if theme.tags.length > 3}
					<span class="px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary rounded"
						>+{theme.tags.length - 3}</span
					>
				{/if}
			</div>
		{/if}

		<!-- Stats -->
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<DownloadSimple size={14} />
				<span>{formatCount(theme.downloadCount)}</span>
			</div>

			<div class="flex items-center gap-0.5" role="group" aria-label="Bewertung">
				{#each [1, 2, 3, 4, 5] as star}
					<button
						type="button"
						class="bg-transparent border-none p-0 cursor-pointer transition-transform hover:scale-110
						{star <= (hoverRating ?? theme.userRating ?? 0) ? 'text-yellow-500' : ''}
						{!hoverRating && !theme.userRating && star <= Math.round(theme.averageRating)
							? 'text-yellow-500/60'
							: ''}
						{star > (hoverRating ?? theme.userRating ?? Math.round(theme.averageRating))
							? 'text-muted-foreground/40'
							: ''}"
						onclick={(e) => {
							e.stopPropagation();
							handleStarClick(star);
						}}
						onmouseenter={() => handleStarHover(star)}
						onmouseleave={() => handleStarHover(null)}
						aria-label={`${star} Stern${star > 1 ? 'e' : ''}`}
					>
						<Star
							size={14}
							weight={star <= (hoverRating ?? theme.userRating ?? Math.round(theme.averageRating))
								? 'fill'
								: 'regular'}
						/>
					</button>
				{/each}
				<span class="ml-1 text-[10px] text-muted-foreground">({theme.ratingCount})</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-2 mt-1">
			{#if showDownload}
				<button
					type="button"
					class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 text-[13px] font-medium rounded-lg transition-colors
					{theme.isDownloaded
						? 'bg-success/10 border border-success/30 text-success'
						: 'bg-primary border border-primary text-primary-foreground hover:bg-primary/90'}"
					onclick={(e) => {
						e.stopPropagation();
						onDownload?.(theme);
					}}
				>
					<DownloadSimple size={16} />
					{theme.isDownloaded ? 'Installiert' : 'Installieren'}
				</button>
			{/if}

			{#if showFavorite}
				<button
					type="button"
					class="flex items-center justify-center p-2 rounded-lg border transition-colors flex-shrink-0
					{theme.isFavorited
						? 'text-red-500 bg-red-500/10 border-red-500/30'
						: 'bg-muted border-border text-foreground hover:bg-muted/80'}"
					onclick={(e) => {
						e.stopPropagation();
						onToggleFavorite?.(theme);
					}}
					aria-label={theme.isFavorited ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
				>
					<Heart size={18} weight={theme.isFavorited ? 'fill' : 'regular'} />
				</button>
			{/if}
		</div>
	</div>
</article>
