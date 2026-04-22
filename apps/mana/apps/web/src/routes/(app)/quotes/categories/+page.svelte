<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { QuotesEvents } from '@mana/shared-utils/analytics';
	import { CATEGORIES, getQuotesByCategory, type Category } from '@quotes/content';

	// Category data with icons and gradients
	const categoryData: Record<
		Category,
		{ icon: string; gradient: string; labelKey: string; count: number }
	> = {
		weisheit: {
			icon: '🧠',
			gradient: 'from-violet-500 to-purple-600',
			labelKey: 'categories.wisdom',
			count: getQuotesByCategory('weisheit').length,
		},
		motivation: {
			icon: '🔥',
			gradient: 'from-orange-500 to-red-500',
			labelKey: 'categories.motivation',
			count: getQuotesByCategory('motivation').length,
		},
		liebe: {
			icon: '❤️',
			gradient: 'from-pink-500 to-rose-500',
			labelKey: 'categories.love',
			count: getQuotesByCategory('liebe').length,
		},
		leben: {
			icon: '🌱',
			gradient: 'from-emerald-500 to-cyan-500',
			labelKey: 'categories.life',
			count: getQuotesByCategory('leben').length,
		},
		erfolg: {
			icon: '🏆',
			gradient: 'from-indigo-500 to-purple-500',
			labelKey: 'categories.success',
			count: getQuotesByCategory('erfolg').length,
		},
		glueck: {
			icon: '☀️',
			gradient: 'from-yellow-400 to-orange-500',
			labelKey: 'categories.happiness',
			count: getQuotesByCategory('glueck').length,
		},
		freundschaft: {
			icon: '🤝',
			gradient: 'from-blue-500 to-indigo-500',
			labelKey: 'categories.friendship',
			count: getQuotesByCategory('freundschaft').length,
		},
		mut: {
			icon: '🦁',
			gradient: 'from-red-500 to-red-700',
			labelKey: 'categories.courage',
			count: getQuotesByCategory('mut').length,
		},
		hoffnung: {
			icon: '🌈',
			gradient: 'from-teal-500 to-sky-500',
			labelKey: 'categories.hope',
			count: getQuotesByCategory('hoffnung').length,
		},
		natur: {
			icon: '🌿',
			gradient: 'from-green-500 to-emerald-500',
			labelKey: 'categories.nature',
			count: getQuotesByCategory('natur').length,
		},
		humor: {
			icon: '😄',
			gradient: 'from-amber-400 to-yellow-500',
			labelKey: 'categories.humor',
			count: getQuotesByCategory('humor').length,
		},
		wissenschaft: {
			icon: '🔬',
			gradient: 'from-cyan-500 to-blue-600',
			labelKey: 'categories.science',
			count: getQuotesByCategory('wissenschaft').length,
		},
		kunst: {
			icon: '🎨',
			gradient: 'from-fuchsia-500 to-pink-600',
			labelKey: 'categories.art',
			count: getQuotesByCategory('kunst').length,
		},
	};
</script>

<svelte:head>
	<title>Quotes - {$_('categories.title')}</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<h1 class="text-3xl font-bold text-foreground mb-8">{$_('categories.title')}</h1>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each CATEGORIES as category}
			{@const data = categoryData[category]}
			<button
				onclick={() => {
					QuotesEvents.categoryViewed(category);
					goto(`/quotes/category/${category}`);
				}}
				class="group p-6 rounded-2xl bg-gradient-to-br {data.gradient} text-white text-left transition-transform hover:scale-105 hover:shadow-xl"
			>
				<div class="text-4xl mb-3">{data.icon}</div>
				<h2 class="text-xl font-semibold mb-1">{$_(data.labelKey)}</h2>
				<p class="text-foreground text-sm">
					{$_('categories.quotes', { values: { count: data.count } })}
				</p>
			</button>
		{/each}
	</div>
</div>
