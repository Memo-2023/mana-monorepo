<script lang="ts">
	import { onMount } from 'svelte';
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { getService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { createFeedbackService } from '@manacore/shared-feedback-service';

	let feedbackService = $state<ReturnType<typeof createFeedbackService> | null>(null);

	onMount(async () => {
		feedbackService = await getService();
	});
</script>

{#if feedbackService}
	<FeedbackPage {feedbackService} appName="ManaCore" currentUserId={authStore.user?.id} />
{:else}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-muted-foreground">Loading...</div>
	</div>
{/if}
