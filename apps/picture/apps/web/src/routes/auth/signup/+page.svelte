<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage, setGoogleClientId } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import PictureLogo from '$lib/components/branding/PictureLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_APPLE_CLIENT_ID } from '$env/static/public';

	// Default to German
	const translations = getRegisterTranslations('de');

	onMount(() => {
		if (PUBLIC_GOOGLE_CLIENT_ID) {
			setGoogleClientId(PUBLIC_GOOGLE_CLIENT_ID);
		}
	});

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleSignUpWithGoogle() {
		// TODO: Implement OAuth with Mana Core Auth when ready
		return { success: false, error: 'Google Sign-Up not yet implemented' };
	}

	async function handleSignUpWithApple() {
		// TODO: Implement OAuth with Mana Core Auth when ready
		return { success: false, error: 'Apple Sign-Up not yet implemented' };
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
	onSignUpWithGoogle={PUBLIC_GOOGLE_CLIENT_ID ? handleSignUpWithGoogle : undefined}
	onSignUpWithApple={PUBLIC_APPLE_CLIENT_ID ? handleSignUpWithApple : undefined}
	{goto}
	enableGoogle={!!PUBLIC_GOOGLE_CLIENT_ID}
	enableApple={!!PUBLIC_APPLE_CLIENT_ID}
	successRedirect="/app/gallery"
	loginPath="/auth/login"
	lightBackground="#f0f9ff"
	darkBackground="#0c1929"
	{translations}
/>
