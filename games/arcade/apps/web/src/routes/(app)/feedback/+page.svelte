<script lang="ts">
	import { FeedbackPage } from '@manacore/feedback';
	import { feedbackService } from '$lib/services/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Feedback - Arcade</title>
</svelte:head>

<FeedbackPage {feedbackService} appName="Arcade" currentUserId={authStore.user?.id} />
