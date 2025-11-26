<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { UloadLogo } from '@manacore/shared-branding';
	import { pb } from '$lib/pocketbase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	async function handleSignIn(email: string, password: string) {
		try {
			await pb.collection('users').authWithPassword(email, password);
			// Invalidate all data to refresh server-side auth state
			await invalidateAll();
			return { success: true };
		} catch (err: any) {
			return {
				success: false,
				error: err?.message || 'Ungültige E-Mail oder Passwort'
			};
		}
	}
</script>

<LoginPage
	appName="uLoad"
	logo={UloadLogo}
	primaryColor="#3b82f6"
	onSignIn={handleSignIn}
	goto={goto}
	enableGoogle={false}
	enableApple={false}
	successRedirect="/my"
	registerPath="/register"
	forgotPasswordPath="/forgot-password"
	lightBackground="#f8fafc"
	darkBackground="#0f172a"
	translations={{
		title: 'Anmelden',
		subtitle: 'Melde dich mit deinem uLoad Account an',
		emailPlaceholder: 'E-Mail',
		passwordPlaceholder: 'Passwort',
		rememberMe: 'Angemeldet bleiben',
		forgotPassword: 'Passwort vergessen?',
		signInButton: 'Anmelden',
		signingIn: 'Wird angemeldet...',
		success: 'Erfolg!',
		orDivider: 'oder',
		noAccount: 'Noch kein Account?',
		createAccount: 'Jetzt registrieren',
		skipToForm: 'Zum Login-Formular springen',
		showPassword: 'Passwort anzeigen',
		hidePassword: 'Passwort verbergen',
		emailRequired: 'E-Mail ist erforderlich',
		emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein',
		passwordRequired: 'Passwort ist erforderlich',
		signInFailed: 'Anmeldung fehlgeschlagen',
		googleSignInFailed: 'Google-Anmeldung fehlgeschlagen',
		signInSuccess: 'Erfolgreich angemeldet. Weiterleitung...',
		googleSignInSuccess: 'Erfolgreich mit Google angemeldet. Weiterleitung...'
	}}
/>
