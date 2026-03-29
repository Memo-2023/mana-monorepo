<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Arcade - Registrieren</title>
</svelte:head>

<RegisterPage {authStore} {goto} appName="Arcade" loginHref="/login" primaryColor="#00ff88" />
