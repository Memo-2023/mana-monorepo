<script lang="ts">
	import { FeedbackPage } from '@manacore/feedback';
	import { feedbackService } from '$lib/api/feedback';
	import { auth } from '$lib/stores/auth.svelte';
</script>

<FeedbackPage {feedbackService} appName="Presi" currentUserId={auth.user?.id} />
