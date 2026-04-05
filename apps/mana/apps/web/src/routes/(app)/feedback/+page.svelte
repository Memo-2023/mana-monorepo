<script lang="ts">
	import { FeedbackPage } from '@mana/feedback';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<FeedbackPage {feedbackService} appName="Mana" currentUserId={authStore.user?.id} />
