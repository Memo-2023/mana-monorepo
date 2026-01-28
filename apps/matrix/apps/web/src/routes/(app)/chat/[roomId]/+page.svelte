<script lang="ts">
	import { page } from '$app/stores';
	import { matrixStore } from '$lib/matrix';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Get roomId from URL and select that room
	onMount(() => {
		const roomId = $page.params.roomId;
		if (roomId) {
			// URL decode the room ID (Matrix room IDs contain special chars)
			const decodedRoomId = decodeURIComponent(roomId);
			matrixStore.selectRoom(decodedRoomId);
		}
	});

	// Redirect to main chat page - the room selection is handled there
	$effect(() => {
		goto('/chat');
	});
</script>

<!-- This page just handles deep-linking to specific rooms -->
<div class="flex h-screen items-center justify-center">
	<p class="text-base-content/60">Loading room...</p>
</div>
