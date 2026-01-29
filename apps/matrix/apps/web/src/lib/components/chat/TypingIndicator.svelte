<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { User } from '@manacore/shared-icons';

	interface Props {
		users: string[];
	}

	let { users }: Props = $props();

	// Get full user info from room members
	let typingUsers = $derived(() => {
		const members = matrixStore.getRoomMembers();
		return users.map((name) => {
			const member = members.find((m) => m.displayName === name);
			return {
				name,
				avatarUrl: member?.avatarUrl,
			};
		});
	});

	let text = $derived(() => {
		if (users.length === 0) return '';
		if (users.length === 1) return `${users[0]} tippt...`;
		if (users.length === 2) return `${users[0]} und ${users[1]} tippen...`;
		return `${users[0]} und ${users.length - 1} weitere tippen...`;
	});
</script>

{#if users.length > 0}
	<div class="flex items-center gap-3 px-4 py-2">
		<!-- User avatars (stacked) -->
		<div class="flex -space-x-2">
			{#each typingUsers().slice(0, 3) as user, i}
				{#if user.avatarUrl}
					<img
						src={user.avatarUrl}
						alt={user.name}
						class="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 object-cover"
						style="z-index: {3 - i}"
					/>
				{:else}
					<div
						class="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
						style="z-index: {3 - i}"
					>
						<User class="w-3 h-3 text-white" />
					</div>
				{/if}
			{/each}
		</div>

		<!-- Animated dots -->
		<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10">
			<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]"></span>
			<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]"></span>
			<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]"></span>
		</div>

		<!-- Text -->
		<span class="text-sm text-muted-foreground">{text()}</span>
	</div>
{/if}
