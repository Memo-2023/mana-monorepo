<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	let error = $state('');
	let loading = $state(false);

	async function handleRegister(email: string, password: string) {
		loading = true;
		error = '';

		const result = await authStore.signUp(email, password);

		if (result.success) {
			if (result.needsVerification) {
				// Show verification message or redirect to verification page
				goto('/login?registered=true');
			} else {
				goto('/');
			}
		} else {
			error = result.error || 'Registrierung fehlgeschlagen';
		}

		loading = false;
	}
</script>

<RegisterPage
	appName="Clock"
	appLogo=""
	{loading}
	{error}
	onSubmit={handleRegister}
	loginHref="/login"
/>
