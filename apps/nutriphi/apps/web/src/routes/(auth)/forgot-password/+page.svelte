<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { NutriPhiLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	const translations = $derived(getForgotPasswordTranslations('de'));

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} | NutriPhi</title>
</svelte:head>

<ForgotPasswordPage
	appName="NutriPhi"
	logo={NutriPhiLogo}
	primaryColor="#22C55E"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#dcfce7"
	darkBackground="#052e16"
	{translations}
/>
