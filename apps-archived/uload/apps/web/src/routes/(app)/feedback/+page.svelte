<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { feedbackService } from '$lib/api/feedback';
	import { pb } from '$lib/pocketbase';
</script>

<FeedbackPage
	{feedbackService}
	appName="uLoad"
	currentUserId={pb.authStore.record?.id}
/>
