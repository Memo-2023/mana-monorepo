<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { MailLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	const translations = {
		title: 'Create Account',
		emailPlaceholder: 'you@example.com',
		passwordPlaceholder: 'Create a password',
		confirmPasswordPlaceholder: 'Confirm your password',
		createAccountButton: 'Create Account',
		creatingAccount: 'Creating account...',
		backToLogin: 'Already have an account? Sign in',
		passwordRequirements: 'Password must be at least 8 characters',
	};

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} | Mail</title>
</svelte:head>

<RegisterPage
	appName="Mail"
	logo={MailLogo}
	primaryColor="#6366f1"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#e0e7ff"
	darkBackground="#1e1b4b"
	{translations}
/>
