<script lang="ts">
	import { BOTS, CATEGORIES, type BotCategory, type BotInfo } from '$lib/data/bots';
	import { matrixStore } from '$lib/matrix';
	import { goto } from '$app/navigation';
	import { _ as t } from 'svelte-i18n';
	import { MagnifyingGlass, Robot, CircleNotch } from '@mana/shared-icons';
	import BotCard from '$lib/components/bots/BotCard.svelte';

	let search = $state('');
	let selectedCategory = $state<BotCategory>('all');
	let startingChat = $state<string | null>(null);

	let filteredBots = $derived(
		BOTS.filter((bot) => {
			const searchLower = search.toLowerCase();
			const matchesSearch =
				bot.name.toLowerCase().includes(searchLower) ||
				bot.description.toLowerCase().includes(searchLower) ||
				bot.commands.some((cmd) => cmd.command.toLowerCase().includes(searchLower));
			const matchesCategory = selectedCategory === 'all' || bot.category === selectedCategory;
			return matchesSearch && matchesCategory;
		})
	);

	let categoryLabels = $derived(
		CATEGORIES.map((cat) => ({
			...cat,
			label: $t(`bots.categories.${cat.id}`),
		}))
	);

	async function startChat(bot: BotInfo) {
		startingChat = bot.id;

		try {
			// Check if a DM room with this bot already exists
			const existingRoom = matrixStore.directRooms.find((r) => r.dmUserId === bot.matrixUserId);

			if (existingRoom) {
				// Select existing room
				matrixStore.selectRoom(existingRoom.id);
			} else {
				// Create new DM room with the bot
				const roomId = await matrixStore.createRoom({
					isDirect: true,
					invite: [bot.matrixUserId],
				});

				if (roomId) {
					matrixStore.selectRoom(roomId);
				}
			}

			// Navigate to chat
			goto('/chat');
		} catch (err) {
			console.error('Failed to start chat with bot:', err);
		} finally {
			startingChat = null;
		}
	}
</script>

<svelte:head>
	<title>{$t('bots.title')} - Manalink</title>
</svelte:head>

<div class="h-full overflow-y-auto bg-background">
	<div class="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
		<!-- Header -->
		<div class="mb-6">
			<div class="flex items-center gap-3 mb-2">
				<div class="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
					<Robot size={28} class="text-white" weight="fill" />
				</div>
				<div>
					<h1 class="text-2xl font-bold text-foreground">{$t('bots.title')}</h1>
					<p class="text-muted-foreground text-sm">{$t('bots.subtitle')}</p>
				</div>
			</div>
		</div>

		<!-- Search -->
		<div class="mb-4">
			<div class="relative">
				<MagnifyingGlass
					size={20}
					class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<input
					type="text"
					bind:value={search}
					placeholder={$t('bots.search')}
					class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
				/>
			</div>
		</div>

		<!-- Category Tabs -->
		<div class="mb-6 overflow-x-auto scrollbar-hide">
			<div class="flex gap-2 min-w-max pb-1">
				{#each categoryLabels as category}
					<button
						class="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer
						{selectedCategory === category.id
							? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
							: 'bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-border'}"
						onclick={() => (selectedCategory = category.id as BotCategory)}
					>
						{category.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Bot Grid -->
		{#if filteredBots.length === 0}
			<div class="text-center py-12">
				<Robot size={48} class="text-muted-foreground/50 mx-auto mb-4" />
				<p class="text-muted-foreground">{$t('bots.noResults')}</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each filteredBots as bot (bot.id)}
					<div class="relative">
						<BotCard {bot} onStartChat={() => startChat(bot)} />
						{#if startingChat === bot.id}
							<div
								class="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
							>
								<CircleNotch size={32} class="text-primary animate-spin" />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Bot Count -->
		<div class="mt-6 text-center text-sm text-muted-foreground">
			{filteredBots.length}
			{filteredBots.length === 1 ? 'Bot' : 'Bots'}
			{#if selectedCategory !== 'all' || search}
				{$t('bots.found')}
			{/if}
		</div>
	</div>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
