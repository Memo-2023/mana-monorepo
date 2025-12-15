<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';
</script>

<FeedbackPage {feedbackService} appName="Clock" currentUserId={authStore.user?.id} />
