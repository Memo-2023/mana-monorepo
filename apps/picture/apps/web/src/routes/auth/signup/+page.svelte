<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import PictureLogo from '$lib/components/branding/PictureLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	// Default to German
	const translations = getRegisterTranslations('de');

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<svelte:head>
	<title>Registrieren - Picture</title>
</svelte:head>

<RegisterPage
	appName="Picture"
	logo={PictureLogo}
	primaryColor="#3b82f6"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/app/gallery"
	loginPath="/auth/login"
	lightBackground="#f0f9ff"
	darkBackground="#0c1929"
	{translations}
/>
