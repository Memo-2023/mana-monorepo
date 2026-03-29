<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { UloadLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleResetPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<ForgotPasswordPage
	appName="uLoad"
	logo={UloadLogo}
	primaryColor="#6366f1"
	onResetPassword={handleResetPassword}
	{goto}
	loginPath="/login"
	translations={{
		title: 'Passwort zurücksetzen',
		subtitle: 'Gib deine E-Mail-Adresse ein',
		emailPlaceholder: 'E-Mail',
		resetButton: 'Link senden',
		backToLogin: 'Zurück zum Login',
	}}
/>
