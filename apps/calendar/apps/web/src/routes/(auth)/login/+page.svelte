<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast';
	import { LoginPage } from '@manacore/shared-auth-ui';

	async function handleLogin(email: string, password: string) {
		const result = await authStore.signIn(email, password);

		if (!result.success) {
			toast.error(result.error || 'Anmeldung fehlgeschlagen');
			return { success: false, error: result.error };
		}

		toast.success('Erfolgreich angemeldet');
		goto('/');
		return { success: true };
	}
</script>

<svelte:head>
	<title>Anmelden | Kalender</title>
</svelte:head>

<LoginPage
	onLogin={handleLogin}
	registerUrl="/register"
	forgotPasswordUrl="/forgot-password"
	appName="Kalender"
/>
