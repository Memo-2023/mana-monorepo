<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import PictureLogo from '$lib/components/branding/PictureLogo.svelte';
	import { authService } from '$lib/services/authService';

	// Default to German
	const translations = getForgotPasswordTranslations('de');

	async function handleForgotPassword(email: string) {
		return authService.forgotPassword(email);
	}
</script>

<svelte:head>
	<title>Passwort vergessen - Picture</title>
</svelte:head>

<ForgotPasswordPage
	appName="Picture"
	logo={PictureLogo}
	primaryColor="#3b82f6"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/auth/login"
	lightBackground="#f0f9ff"
	darkBackground="#0c1929"
	{translations}
/>
