<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { MailLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/');

	const translations = {
		title: 'Sign In',
		subtitle: 'Enter your credentials to access your email',
		emailPlaceholder: 'you@example.com',
		passwordPlaceholder: 'Enter your password',
		signInButton: 'Sign In',
		signingIn: 'Signing in...',
		success: 'Success!',
		noAccount: "Don't have an account?",
		createAccount: 'Sign up',
		forgotPassword: 'Forgot password?',
		orDivider: 'Or continue with',
	};

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<svelte:head>
	<title>{translations.title} | Mail</title>
</svelte:head>

<LoginPage
	appName="Mail"
	logo={MailLogo}
	primaryColor="#6366f1"
	onSignIn={handleSignIn}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#e0e7ff"
	darkBackground="#1e1b4b"
	{translations}
/>
