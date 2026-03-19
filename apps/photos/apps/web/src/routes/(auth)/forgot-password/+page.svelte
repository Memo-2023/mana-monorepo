<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	const translations = getForgotPasswordTranslations('en');

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>Forgot Password - Photos</title>
</svelte:head>

<ForgotPasswordPage
	appName="Photos"
	logo={ManaCoreLogo}
	primaryColor="#8b5cf6"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#faf5ff"
	darkBackground="#1e1b4b"
	{translations}
/>
