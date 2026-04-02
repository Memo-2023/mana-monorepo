<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { MukkeLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	const translations = getForgotPasswordTranslations('en');

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>Forgot Password - Mukke</title>
</svelte:head>

<ForgotPasswordPage
	appName="Mukke"
	logo={MukkeLogo}
	primaryColor="#f97316"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#fff7ed"
	darkBackground="#1c1917"
	{translations}
/>
