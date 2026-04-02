<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { FeedbackPage } from '@manacore/feedback';
	import { createFeedbackService } from '@manacore/feedback';
	import { authStore } from '$lib/stores/auth.svelte';

	const feedbackService = createFeedbackService({
		apiUrl: import.meta.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001',
		appId: 'zitare',
		getAuthToken: () => authStore.getValidToken(),
	});
</script>

<svelte:head>
	<title>Zitare - {$_('nav.feedback')}</title>
</svelte:head>

<FeedbackPage
	{feedbackService}
	appName="Zitare"
	currentUserId={authStore.user?.id}
	pageTitle={$_('feedback.title')}
	pageSubtitle={$_('feedback.subtitle')}
/>
