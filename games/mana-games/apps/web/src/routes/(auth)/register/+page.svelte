<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Mana Games - Registrieren</title>
</svelte:head>

<RegisterPage {authStore} {goto} appName="Mana Games" loginHref="/login" primaryColor="#00ff88" />
