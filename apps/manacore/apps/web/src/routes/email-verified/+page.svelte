<script lang="ts">
	import { goto } from '$app/navigation';
	import { Check } from '@manacore/shared-icons';
</script>

<svelte:head>
	<title>E-Mail bestätigt - ManaCore</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 dark:bg-neutral-900"
>
	<div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-neutral-800">
		<!-- Success Icon -->
		<div
			class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
		>
			<Check size={20} class="text-green-600 dark:text-green-400" />
		</div>

		<h1 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">E-Mail bestätigt!</h1>

		<p class="mb-8 text-gray-600 dark:text-gray-400">
			Deine E-Mail-Adresse wurde erfolgreich bestätigt. Du kannst dich jetzt anmelden und alle
			Funktionen von ManaCore nutzen.
		</p>

		<button
			onclick={() => goto('/login')}
			class="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
		>
			Zur Anmeldung
		</button>
	</div>

	<p class="mt-8 text-sm text-gray-500 dark:text-gray-400">ManaCore - Dein digitales Ökosystem</p>
</div>
