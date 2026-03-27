<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { feedbackService } from '$lib/services/feedback';
</script>

<FeedbackPage {feedbackService} user={authStore.user} appName="Inventar" />
