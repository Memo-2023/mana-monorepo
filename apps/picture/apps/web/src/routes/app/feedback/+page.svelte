<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<FeedbackPage
	{feedbackService}
	appName="Picture"
	currentUserId={authStore.user?.id}
/>
