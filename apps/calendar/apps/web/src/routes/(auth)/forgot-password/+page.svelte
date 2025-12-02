<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';

	async function handleResetPassword(email: string) {
		const result = await authStore.resetPassword(email);

		if (!result.success) {
			toast.error(result.error || 'Anfrage fehlgeschlagen');
			return { success: false, error: result.error };
		}

		toast.success('E-Mail gesendet. Bitte überprüfen Sie Ihren Posteingang.');
		return { success: true };
	}
</script>

<svelte:head>
	<title>Passwort vergessen | Kalender</title>
</svelte:head>

<ForgotPasswordPage
	onResetPassword={handleResetPassword}
	loginUrl="/login"
	appName="Kalender"
/>
