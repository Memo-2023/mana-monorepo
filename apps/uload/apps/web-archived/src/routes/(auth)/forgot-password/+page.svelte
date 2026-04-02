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
	onForgotPassword={handleResetPassword}
	{goto}
	loginPath="/login"
	translations={{
		emailPlaceholder: 'E-Mail',
		backToLogin: 'Zurück zum Login',
	}}
/>
