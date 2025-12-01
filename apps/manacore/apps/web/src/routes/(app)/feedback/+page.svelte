<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/authStore.svelte';
</script>

<FeedbackPage {feedbackService} appName="ManaCore" currentUserId={authStore.user?.id} />
