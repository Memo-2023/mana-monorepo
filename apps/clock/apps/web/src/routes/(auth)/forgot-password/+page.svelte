<script lang="ts">
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleResetPassword(email: string) {
		loading = true;
		error = '';
		success = false;

		const result = await authStore.resetPassword(email);

		if (result.success) {
			success = true;
		} else {
			error = result.error || 'Passwort-Zurücksetzung fehlgeschlagen';
		}

		loading = false;
	}
</script>

<ForgotPasswordPage
	appName="Clock"
	appLogo=""
	{loading}
	{error}
	{success}
	onSubmit={handleResetPassword}
	loginHref="/login"
/>
