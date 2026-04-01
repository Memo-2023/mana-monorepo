<script lang="ts">
	import { FeedbackPage } from '@manacore/feedback';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<FeedbackPage {feedbackService} appName="Cards" currentUserId={authStore.user?.id} />
