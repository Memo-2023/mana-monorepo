<script lang="ts">
	import type { SimpleMessage } from '$lib/matrix';
	import { format, isToday, isYesterday } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		message: SimpleMessage;
		showAvatar?: boolean;
		showTimestamp?: boolean;
	}

	let { message, showAvatar = true, showTimestamp = false }: Props = $props();

	let formattedTime = $derived(format(message.timestamp, 'HH:mm'));

	let formattedDate = $derived(() => {
		const date = new Date(message.timestamp);
		if (isToday(date)) return 'Heute';
		if (isYesterday(date)) return 'Gestern';
		return format(date, 'EEEE, d. MMMM', { locale: de });
	});

	let initials = $derived(
		message.senderName
			.split(' ')
			.map((w) => w[0])
			.join('')
			.substring(0, 2)
			.toUpperCase()
	);
</script>

<!-- Date separator -->
{#if showTimestamp}
	<div class="my-4 flex items-center gap-4">
		<div class="h-px flex-1 bg-base-300"></div>
		<span class="text-xs text-base-content/50">{formattedDate()}</span>
		<div class="h-px flex-1 bg-base-300"></div>
	</div>
{/if}

<!-- Message -->
<div class="group flex gap-3 rounded-lg px-2 py-1 hover:bg-base-200/50" class:mt-2={showAvatar}>
	<!-- Avatar Column -->
	<div class="w-10 flex-shrink-0">
		{#if showAvatar && !message.isOwn}
			<div class="avatar placeholder">
				<div class="w-10 rounded-full bg-neutral text-neutral-content">
					<span class="text-xs">{initials}</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="min-w-0 flex-1">
		{#if showAvatar}
			<div class="mb-0.5 flex items-baseline gap-2">
				<span class="font-medium" class:text-primary={message.isOwn}>
					{message.isOwn ? 'Du' : message.senderName}
				</span>
				<span class="text-xs text-base-content/40">{formattedTime}</span>
				{#if message.edited}
					<span class="text-xs text-base-content/40">(bearbeitet)</span>
				{/if}
			</div>
		{/if}

		<!-- Message body -->
		<div class="relative">
			{#if message.type === 'm.emote'}
				<p class="italic text-base-content/80">* {message.senderName} {message.body}</p>
			{:else if message.type === 'm.notice'}
				<p class="text-sm text-base-content/60">{message.body}</p>
			{:else}
				<p class="whitespace-pre-wrap break-words">{message.body}</p>
			{/if}

			<!-- Hover timestamp for grouped messages -->
			{#if !showAvatar}
				<span
					class="absolute -left-12 top-0 hidden text-xs text-base-content/40 group-hover:inline"
				>
					{formattedTime}
				</span>
			{/if}
		</div>
	</div>
</div>
