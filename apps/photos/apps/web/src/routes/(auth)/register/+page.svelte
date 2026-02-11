<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} | Photos</title>
</svelte:head>

<RegisterPage
	appName="Photos"
	primaryColor="#8b5cf6"
	onSignUp={handleSignUp}
	{goto}
	loginPath="/login"
	lightBackground="#faf5ff"
	darkBackground="#1e1b4b"
	{translations}
/>
