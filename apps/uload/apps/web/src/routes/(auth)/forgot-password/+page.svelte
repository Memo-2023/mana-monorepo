<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { UloadLogo } from '@manacore/shared-branding';
	import { pb } from '$lib/pocketbase';

	async function handleForgotPassword(email: string) {
		try {
			await pb.collection('users').requestPasswordReset(email);
			return { success: true };
		} catch (err: any) {
			// PocketBase doesn't reveal if email exists for security
			// So we always show success message
			return { success: true };
		}
	}
</script>

<ForgotPasswordPage
	appName="uLoad"
	logo={UloadLogo}
	primaryColor="#3b82f6"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#f8fafc"
	darkBackground="#0f172a"
	translations={{
		titleForm: 'Passwort zurücksetzen',
		titleSuccess: 'E-Mail gesendet',
		description:
			'Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.',
		emailPlaceholder: 'E-Mail',
		sendResetLinkButton: 'Link senden',
		sending: 'Wird gesendet...',
		backToLogin: 'Zurück zum Login',
		resendEmail: 'E-Mail erneut senden',
		successMessage:
			'Wir haben einen Link zum Zurücksetzen deines Passworts an {email} gesendet. Bitte überprüfe deinen Posteingang.',
		emailRequired: 'E-Mail ist erforderlich',
		sendFailed: 'Senden der E-Mail fehlgeschlagen',
	}}
/>
