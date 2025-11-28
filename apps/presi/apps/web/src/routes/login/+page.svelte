<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { PresiLogo } from '@manacore/shared-branding';
	import { auth } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// Get redirect URL from query params
	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/');

	// English translations
	const translations = {
		title: 'Sign In',
		subtitle: 'Sign in with your account',
		emailPlaceholder: 'Email',
		passwordPlaceholder: 'Password',
		rememberMe: 'Remember me',
		forgotPassword: 'Forgot password?',
		signInButton: 'Sign In',
		signingIn: 'Signing in...',
		success: 'Success!',
		orDivider: 'or',
		noAccount: "Don't have an account?",
		createAccount: 'Create one',
		skipToForm: 'Skip to login form',
		showPassword: 'Show password',
		hidePassword: 'Hide password',
		emailRequired: 'Email is required',
		emailInvalid: 'Please enter a valid email address',
		passwordRequired: 'Password is required',
		signInFailed: 'Sign in failed',
		googleSignInFailed: 'Google sign in failed',
		signInSuccess: 'Successfully signed in. Redirecting...',
		googleSignInSuccess: 'Successfully signed in with Google. Redirecting...',
	};

	async function handleSignIn(email: string, password: string) {
		return auth.login(email, password);
	}
</script>

<svelte:head>
	<title>Login | Presi</title>
</svelte:head>

<LoginPage
	appName="Presi"
	logo={PresiLogo}
	primaryColor="#f97316"
	onSignIn={handleSignIn}
	{goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect={redirectTo}
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#fff7ed"
	darkBackground="#1c1210"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</LoginPage>
