<script lang="ts">
	import { FeedbackPage } from '@manacore/feedback';
	import { feedbackService } from '$lib/services/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<FeedbackPage {feedbackService} appName="Contacts" currentUserId={authStore.user?.id} />
