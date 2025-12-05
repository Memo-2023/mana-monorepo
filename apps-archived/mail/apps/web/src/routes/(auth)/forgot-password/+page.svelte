<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { MailLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	const translations = {
		titleForm: 'Reset Password',
		titleSuccess: 'Email Sent',
		description: 'Enter your email to receive a password reset link',
		emailPlaceholder: 'you@example.com',
		sendResetLinkButton: 'Send Reset Link',
		sending: 'Sending...',
		backToLogin: 'Back to sign in',
		successMessage: 'Check your email for a password reset link',
	};

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} | Mail</title>
</svelte:head>

<ForgotPasswordPage
	appName="Mail"
	logo={MailLogo}
	primaryColor="#6366f1"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#e0e7ff"
	darkBackground="#1e1b4b"
	{translations}
/>
