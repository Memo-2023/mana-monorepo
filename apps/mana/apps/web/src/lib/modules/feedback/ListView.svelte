<!--
  Feedback — Workbench-embedded feedback/bug-report form.
-->
<script lang="ts">
	import { FeedbackPage } from '@mana/feedback';
	import { feedbackService } from '$lib/api/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<div class="feedback-page">
	<FeedbackPage {feedbackService} appName="Mana" currentUserId={authStore.user?.id} />
</div>

<style>
	.feedback-page {
		padding: 0.75rem;
		height: 100%;
		overflow-y: auto;
	}
</style>
