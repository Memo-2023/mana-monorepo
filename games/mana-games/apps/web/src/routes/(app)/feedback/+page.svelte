<script lang="ts">
	import { FeedbackPage } from '@manacore/feedback';
	import { feedbackService } from '$lib/services/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Feedback - Mana Games</title>
</svelte:head>

<FeedbackPage {feedbackService} appName="Mana Games" currentUserId={authStore.user?.id} />
