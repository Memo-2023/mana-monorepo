<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { UloadLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<RegisterPage
	appName="uLoad"
	logo={UloadLogo}
	primaryColor="#6366f1"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/my/links"
	loginPath="/login"
	translations={{
		emailPlaceholder: 'E-Mail',
		passwordPlaceholder: 'Passwort',
	}}
/>
