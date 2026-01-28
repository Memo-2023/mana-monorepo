<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { Menu, Phone, Video, Info, Lock, Users } from 'lucide-svelte';

	interface Props {
		onMenuClick?: () => void;
		onInfoClick?: () => void;
	}

	let { onMenuClick, onInfoClick }: Props = $props();

	let room = $derived(matrixStore.currentSimpleRoom);
</script>

{#if room}
	<header class="flex items-center gap-3 border-b border-base-300 bg-base-100 px-4 py-3">
		<!-- Mobile menu button -->
		<button class="btn btn-ghost btn-sm lg:hidden" onclick={onMenuClick}>
			<Menu class="h-5 w-5" />
		</button>

		<!-- Room avatar -->
		<div class="avatar placeholder">
			<div class="w-10 rounded-full bg-neutral text-neutral-content">
				{#if room.avatar}
					<img src={room.avatar} alt={room.name} />
				{:else}
					<span class="text-sm">{room.name.charAt(0).toUpperCase()}</span>
				{/if}
			</div>
		</div>

		<!-- Room info -->
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h2 class="truncate font-semibold">{room.name}</h2>
				{#if room.isEncrypted}
					<Lock class="h-4 w-4 flex-shrink-0 text-success" title="End-to-end encrypted" />
				{/if}
			</div>
			<p class="flex items-center gap-1 text-sm text-base-content/60">
				{#if room.topic}
					<span class="truncate">{room.topic}</span>
				{:else if room.isDirect}
					<span>Direct message</span>
				{:else}
					<Users class="h-3 w-3" />
					<span>{room.memberCount} members</span>
				{/if}
			</p>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-1">
			<button class="btn btn-ghost btn-sm" title="Voice call" disabled>
				<Phone class="h-5 w-5" />
			</button>
			<button class="btn btn-ghost btn-sm" title="Video call" disabled>
				<Video class="h-5 w-5" />
			</button>
			<button class="btn btn-ghost btn-sm" title="Room info" onclick={onInfoClick}>
				<Info class="h-5 w-5" />
			</button>
		</div>
	</header>
{/if}
