<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { PresiLogo } from '@manacore/shared-branding';
	import { auth } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// English translations
	const translations = {
		title: 'Create Account',
		emailPlaceholder: 'Email',
		passwordPlaceholder: 'Password',
		confirmPasswordPlaceholder: 'Confirm Password',
		passwordRequirements:
			'Password must be at least 8 characters with lowercase, uppercase, number, and special character.',
		createAccountButton: 'Create Account',
		creatingAccount: 'Creating Account...',
		backToLogin: 'Back to Login',
		showPassword: 'Show password',
		hidePassword: 'Hide password',
		emailRequired: 'Email is required',
		passwordRequired: 'Password is required',
		confirmPasswordRequired: 'Please confirm your password',
		passwordsDoNotMatch: 'Passwords do not match',
		passwordTooShort: 'Password must be at least 8 characters',
		passwordStrengthError:
			'Password must include lowercase, uppercase, number, and special character',
		registrationFailed: 'Registration failed',
		accountCreated: 'Account created! Please check your email to verify your account.',
	};

	async function handleSignUp(email: string, password: string) {
		return auth.register(email, password);
	}
</script>

<svelte:head>
	<title>Register | Presi</title>
</svelte:head>

<RegisterPage
	appName="Presi"
	logo={PresiLogo}
	primaryColor="#f97316"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#fff7ed"
	darkBackground="#1c1210"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
