<script lang="ts">
	import type { SimpleRoom } from '$lib/matrix';
	import { formatDistanceToNow } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { Lock, Users } from 'lucide-svelte';

	interface Props {
		room: SimpleRoom;
		selected: boolean;
		onclick: () => void;
	}

	let { room, selected, onclick }: Props = $props();

	let timeAgo = $derived(
		room.lastMessageTime
			? formatDistanceToNow(room.lastMessageTime, { addSuffix: false, locale: de })
			: ''
	);

	let initials = $derived(
		room.name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.substring(0, 2)
			.toUpperCase()
	);
</script>

<button
	class="flex w-full items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-hover {selected
		? 'bg-primary/10 hover:bg-primary/20'
		: ''}"
	{onclick}
>
	<!-- Avatar -->
	<div class="avatar placeholder">
		<div
			class="w-12 rounded-full bg-neutral text-neutral-content"
			class:bg-primary={selected}
			class:text-primary-content={selected}
		>
			{#if room.avatar}
				<img src={room.avatar} alt={room.name} class="object-cover" />
			{:else}
				<span class="text-sm font-medium">{initials}</span>
			{/if}
		</div>
	</div>

	<!-- Room Info -->
	<div class="flex min-w-0 flex-1 flex-col items-start">
		<div class="flex w-full items-center gap-1">
			<span class="truncate font-medium">{room.name}</span>
			{#if room.isEncrypted}
				<Lock class="h-3 w-3 flex-shrink-0 text-success" />
			{/if}
			{#if !room.isDirect && room.memberCount > 2}
				<span class="flex items-center text-xs text-base-content/50">
					<Users class="mr-0.5 h-3 w-3" />
					{room.memberCount}
				</span>
			{/if}
		</div>
		{#if room.lastMessage}
			<p class="w-full truncate text-left text-sm text-base-content/60">
				{#if room.lastMessageSender && !room.isDirect}
					<span class="font-medium">{room.lastMessageSender}:</span>
				{/if}
				{room.lastMessage}
			</p>
		{/if}
	</div>

	<!-- Meta -->
	<div class="flex flex-shrink-0 flex-col items-end gap-1">
		{#if timeAgo}
			<span class="text-xs text-base-content/40">{timeAgo}</span>
		{/if}
		{#if room.unreadCount > 0}
			<span
				class="badge badge-sm"
				class:badge-primary={room.highlightCount === 0}
				class:badge-error={room.highlightCount > 0}
			>
				{room.unreadCount > 99 ? '99+' : room.unreadCount}
			</span>
		{/if}
	</div>
</button>
