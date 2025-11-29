<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { feedbackService } from '$lib/services/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<FeedbackPage
	{feedbackService}
	appName="ManaChat"
	currentUserId={authStore.user?.id}
/>
