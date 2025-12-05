<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { createFeedbackService } from '@manacore/shared-feedback-service';
	import { authStore } from '$lib/stores';

	const feedbackService = createFeedbackService({
		appId: 'inventory',
		apiUrl: import.meta.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001',
		getAuthToken: () => authStore.getAccessToken(),
	});
</script>

<svelte:head>
	<title>{$_('nav.feedback')} - {$_('app.name')}</title>
</svelte:head>

<FeedbackPage {feedbackService} appName={$_('app.name')} currentUserId={authStore.user?.id} />
