<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast';
	import { RegisterPage } from '@manacore/shared-auth-ui';

	async function handleRegister(email: string, password: string) {
		const result = await authStore.signUp(email, password);

		if (!result.success) {
			toast.error(result.error || 'Registrierung fehlgeschlagen');
			return { success: false, error: result.error };
		}

		if (result.needsVerification) {
			toast.info('Bitte bestätigen Sie Ihre E-Mail-Adresse');
			goto('/login');
			return { success: true, needsVerification: true };
		}

		toast.success('Erfolgreich registriert');
		goto('/');
		return { success: true };
	}
</script>

<svelte:head>
	<title>Registrieren | Kalender</title>
</svelte:head>

<RegisterPage
	onRegister={handleRegister}
	loginUrl="/login"
	appName="Kalender"
/>
