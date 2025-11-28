<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { PresiLogo } from '@manacore/shared-branding';
	import { auth } from '$lib/stores/auth.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';

	// English translations
	const translations = {
		titleForm: 'Reset Password',
		titleSuccess: 'Email Sent',
		description: "Enter your email address and we'll send you a link to reset your password.",
		emailPlaceholder: 'Email',
		sendResetLinkButton: 'Send Reset Link',
		sending: 'Sending...',
		backToLogin: 'Back to Login',
		resendEmail: 'Resend Email',
		successMessage: "We've sent a password reset link to {email}. Please check your inbox.",
		emailRequired: 'Email is required',
		sendFailed: 'Failed to send reset email',
	};

	async function handleForgotPassword(email: string) {
		return auth.forgotPassword(email);
	}
</script>

<svelte:head>
	<title>Forgot Password | Presi</title>
</svelte:head>

<ForgotPasswordPage
	appName="Presi"
	logo={PresiLogo}
	primaryColor="#f97316"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#fff7ed"
	darkBackground="#1c1210"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
