<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { UloadLogo } from '@manacore/shared-branding';
	import { pb } from '$lib/pocketbase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	async function handleSignUp(email: string, password: string) {
		try {
			// Create user
			await pb.collection('users').create({
				email: email.toLowerCase().trim(),
				password,
				passwordConfirm: password,
				emailVisibility: true
			});

			// Request verification email
			try {
				await pb.collection('users').requestVerification(email);
			} catch (emailErr) {
				console.error('Failed to send verification email:', emailErr);
			}

			return {
				success: true,
				needsVerification: true
			};
		} catch (err: any) {
			const errorData = err?.response?.data || err?.data || {};

			if (errorData.email?.message?.includes('unique')) {
				return {
					success: false,
					error: 'Diese E-Mail ist bereits registriert. Bitte melde dich an.'
				};
			}

			if (errorData.email?.message) {
				return { success: false, error: errorData.email.message };
			}

			if (errorData.password?.message) {
				return { success: false, error: errorData.password.message };
			}

			return {
				success: false,
				error: err?.message || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.'
			};
		}
	}
</script>

<RegisterPage
	appName="uLoad"
	logo={UloadLogo}
	primaryColor="#3b82f6"
	onSignUp={handleSignUp}
	goto={goto}
	successRedirect="/login?registered=true"
	loginPath="/login"
	lightBackground="#f8fafc"
	darkBackground="#0f172a"
	translations={{
		title: 'Account erstellen',
		emailPlaceholder: 'E-Mail',
		passwordPlaceholder: 'Passwort',
		confirmPasswordPlaceholder: 'Passwort bestätigen',
		passwordRequirements: 'Passwort muss mindestens 8 Zeichen mit Kleinbuchstaben, Großbuchstaben, Zahl und Sonderzeichen enthalten.',
		createAccountButton: 'Account erstellen',
		creatingAccount: 'Wird erstellt...',
		backToLogin: 'Zurück zum Login',
		showPassword: 'Passwort anzeigen',
		hidePassword: 'Passwort verbergen',
		emailRequired: 'E-Mail ist erforderlich',
		passwordRequired: 'Passwort ist erforderlich',
		confirmPasswordRequired: 'Bitte bestätige dein Passwort',
		passwordsDoNotMatch: 'Passwörter stimmen nicht überein',
		passwordTooShort: 'Passwort muss mindestens 8 Zeichen haben',
		passwordStrengthError: 'Passwort muss Kleinbuchstaben, Großbuchstaben, Zahl und Sonderzeichen enthalten',
		registrationFailed: 'Registrierung fehlgeschlagen',
		accountCreated: 'Account erstellt! Bitte überprüfe deine E-Mail zur Verifizierung.'
	}}
/>
