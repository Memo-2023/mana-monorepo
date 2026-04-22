<script lang="ts">
	import { FeedbackPage } from '@mana/feedback';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="feedback">
	<FeedbackPage {feedbackService} appName="Mana" currentUserId={authStore.user?.id} />
</RoutePage>
