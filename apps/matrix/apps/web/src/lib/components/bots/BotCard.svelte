<script lang="ts">
	import type { BotInfo } from '$lib/data/bots';
	import {
		Lock,
		LockOpen,
		CaretDown,
		ChatCircle,
		// Bot icons
		Sparkle,
		Robot,
		CheckSquare,
		CalendarBlank,
		AddressBook,
		Folders,
		Image,
		SpeakerHigh,
		CloudArrowUp,
		ForkKnife,
		Plant,
		Quotes,
		TreeStructure,
		Clock,
		ChartBar,
		MagnifyingGlass,
		Cards,
		PresentationChart,
	} from '@manacore/shared-icons';
	import { slide } from 'svelte/transition';
	import { _ as t } from 'svelte-i18n';
	import type { Component } from 'svelte';

	interface Props {
		bot: BotInfo;
		onStartChat: () => void;
	}

	let { bot, onStartChat }: Props = $props();
	let expanded = $state(false);

	// Map icon names to components
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const iconMap: Record<string, Component<any>> = {
		Sparkle,
		ChatCircle,
		Robot,
		CheckSquare,
		CalendarBlank,
		AddressBook,
		Folders,
		Image,
		SpeakerHigh,
		CloudArrowUp,
		ForkKnife,
		Plant,
		Quotes,
		TreeStructure,
		Clock,
		ChartBar,
		MagnifyingGlass,
		Cards,
		PresentationChart,
	};

	let IconComponent = $derived(iconMap[bot.icon] || Robot);
</script>

<div class="glass-card rounded-xl overflow-hidden border border-border">
	<!-- Header (always visible) -->
	<button
		class="w-full p-4 text-left hover:bg-surface-hover transition-colors cursor-pointer"
		onclick={() => (expanded = !expanded)}
	>
		<div class="flex items-start gap-3">
			<div class="p-3 rounded-lg bg-gradient-to-br {bot.color} shadow-lg flex-shrink-0">
				<svelte:component this={IconComponent} size={24} class="text-white" weight="fill" />
			</div>
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2">
					<h3 class="font-semibold text-foreground truncate">{bot.name}</h3>
					{#if bot.isGateway}
						<span class="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
							Gateway
						</span>
					{/if}
				</div>
				<p class="text-sm text-muted-foreground line-clamp-2 mt-0.5">{bot.description}</p>
			</div>
			<CaretDown
				size={20}
				class="text-muted-foreground transition-transform flex-shrink-0 {expanded
					? 'rotate-180'
					: ''}"
			/>
		</div>

		<div class="mt-3 flex items-center gap-2 flex-wrap">
			{#if bot.requiresAuth}
				<span
					class="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1"
				>
					<Lock size={12} /> Login
				</span>
			{:else}
				<span
					class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"
				>
					<LockOpen size={12} />
					{$t('bots.free')}
				</span>
			{/if}
			<span class="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
				{bot.commands.length}
				{$t('bots.commands')}
			</span>
		</div>
	</button>

	<!-- Expandable Details -->
	{#if expanded}
		<div transition:slide={{ duration: 200 }} class="border-t border-white/10 p-4 space-y-4">
			<!-- Long Description -->
			{#if bot.longDescription}
				<p class="text-sm text-muted-foreground">{bot.longDescription}</p>
			{/if}

			<!-- Commands -->
			<div>
				<h4 class="text-sm font-medium text-foreground mb-2">{$t('bots.commands')}</h4>
				<div class="space-y-1.5 max-h-48 overflow-y-auto">
					{#each bot.commands as cmd}
						<div class="text-xs bg-muted rounded px-2 py-1.5">
							<code class="text-primary font-mono">{cmd.command}</code>
							{#if cmd.aliases?.length}
								<span class="text-muted-foreground"> ({cmd.aliases.join(', ')})</span>
							{/if}
							<span class="text-muted-foreground ml-2">- {cmd.description}</span>
							{#if cmd.example}
								<div class="mt-1 text-muted-foreground/70 italic">
									{$t('bots.example')}: <code class="text-foreground/60">{cmd.example}</code>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Matrix User ID -->
			<div class="text-xs text-muted-foreground">
				<span class="font-medium">Matrix:</span>
				<code class="ml-1 text-foreground/60">{bot.matrixUserId}</code>
			</div>

			<!-- Chat Button -->
			<button
				class="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl cursor-pointer"
				onclick={(e) => {
					e.stopPropagation();
					onStartChat();
				}}
			>
				<ChatCircle size={18} weight="fill" />
				{$t('bots.startChat')}
			</button>
		</div>
	{/if}
</div>
