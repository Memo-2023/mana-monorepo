<script lang="ts">
	import { FeedbackPage } from '@manacore/feedback';
	import { feedbackService } from '$lib/services/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Feedback - Mukke</title>
</svelte:head>

<FeedbackPage {feedbackService} appName="Mukke" currentUserId={authStore.user?.id} />
