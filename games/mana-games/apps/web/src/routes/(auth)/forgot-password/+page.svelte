<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Mana Games - Passwort vergessen</title>
</svelte:head>

<ForgotPasswordPage {authStore} {goto} appName="Mana Games" loginHref="/login" />
