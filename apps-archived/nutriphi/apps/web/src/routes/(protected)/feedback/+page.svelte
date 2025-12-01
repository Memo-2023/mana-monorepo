<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth';
</script>

<FeedbackPage
	{feedbackService}
	appName="Nutriphi"
	currentUserId={authStore.user?.id}
/>
