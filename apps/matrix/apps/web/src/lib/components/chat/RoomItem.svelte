<script lang="ts">
	import type { SimpleRoom } from '$lib/matrix';
	import { formatDistanceToNow, isValid } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { Lock, Users } from '@manacore/shared-icons';

	interface Props {
		room: SimpleRoom;
		selected: boolean;
		onclick: () => void;
	}

	let { room, selected, onclick }: Props = $props();

	let timeAgo = $derived(() => {
		if (!room.lastMessageTime) return '';
		const date = new Date(room.lastMessageTime);
		if (!isValid(date) || date.getTime() === 0) return '';
		return formatDistanceToNow(date, { addSuffix: false, locale: de });
	});

	let initials = $derived(
		room.name
			.split(' ')
			.map((w) => w[0])
			.join('')
			.substring(0, 2)
			.toUpperCase()
	);

	// Online status for DMs
	let isOnline = $derived(room.isDirect && room.presence === 'online');

	// Format last active time
	let lastActiveText = $derived(() => {
		if (!room.isDirect || !room.lastActiveAgo) return '';
		if (room.presence === 'online') return 'Online';
		const minutes = Math.floor(room.lastActiveAgo / 60000);
		if (minutes < 1) return 'Gerade aktiv';
		if (minutes < 60) return `Vor ${minutes} Min.`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `Vor ${hours} Std.`;
		const days = Math.floor(hours / 24);
		return `Vor ${days} Tag${days > 1 ? 'en' : ''}`;
	});
</script>

<button
	class="flex w-full items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200
	       {selected
		? 'bg-surface-elevated shadow-md border border-border'
		: 'hover:bg-surface-hover hover:-translate-y-0.5'}"
	{onclick}
>
	<!-- Avatar with online indicator -->
	<div class="relative flex-shrink-0">
		<div
			class="w-11 h-11 rounded-full flex items-center justify-center shadow-sm
			       {selected
				? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
				: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'}"
		>
			{#if room.avatar}
				<img src={room.avatar} alt={room.name} class="w-11 h-11 rounded-full object-cover" />
			{:else}
				<span class="text-sm font-semibold">{initials}</span>
			{/if}
		</div>
		<!-- Online indicator dot -->
		{#if room.isDirect}
			<div
				class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background
				       {isOnline ? 'bg-green-500' : 'bg-muted-foreground'}"
				title={lastActiveText()}
			></div>
		{/if}
	</div>

	<!-- Room Info -->
	<div class="flex min-w-0 flex-1 flex-col items-start">
		<div class="flex w-full items-center gap-1.5">
			<span class="truncate font-medium text-foreground">{room.name}</span>
			{#if room.isEncrypted}
				<Lock class="h-3 w-3 flex-shrink-0 text-green-500" />
			{/if}
			{#if !room.isDirect && room.memberCount > 2}
				<span class="flex items-center text-xs text-muted-foreground">
					<Users class="mr-0.5 h-3 w-3" />
					{room.memberCount}
				</span>
			{/if}
		</div>
		{#if room.lastMessage}
			<p class="w-full truncate text-left text-sm text-muted-foreground">
				{#if room.lastMessageSender && !room.isDirect}
					<span class="font-medium text-foreground/70">{room.lastMessageSender}:</span>
				{/if}
				{room.lastMessage}
			</p>
		{/if}
	</div>

	<!-- Meta -->
	<div class="flex flex-shrink-0 flex-col items-end gap-1">
		{#if timeAgo()}
			<span class="text-xs text-muted-foreground">{timeAgo()}</span>
		{/if}
		{#if room.unreadCount > 0}
			<span
				class="px-1.5 py-0.5 rounded-full text-xs font-medium text-white
				       {room.highlightCount > 0
					? 'bg-gradient-to-r from-red-500 to-rose-600'
					: 'bg-gradient-to-r from-blue-500 to-indigo-600'}"
			>
				{room.unreadCount > 99 ? '99+' : room.unreadCount}
			</span>
		{/if}
	</div>
</button>
