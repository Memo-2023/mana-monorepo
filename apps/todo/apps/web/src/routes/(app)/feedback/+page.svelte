<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { feedbackService } from '$lib/services/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Feedback | Todo</title>
</svelte:head>

<FeedbackPage {feedbackService} appName="Todo" currentUserId={authStore.user?.id} />
