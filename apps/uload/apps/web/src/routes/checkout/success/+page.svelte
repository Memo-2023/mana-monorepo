<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	let verifying = true;

	onMount(async () => {
		// Verify the session with backend
		const sessionId = $page.url.searchParams.get('session_id');

		if (sessionId) {
			console.log('Payment session completed:', sessionId);
		}

		// Refresh user data
		await invalidateAll();

		verifying = false;
	});
</script>

<svelte:head>
	<title>Zahlung erfolgreich - ulo.ad</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-theme-background px-4 dark:bg-neutral-950"
>
	<div class="max-w-md text-center">
		{#if verifying}
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-theme-primary/20 border-t-theme-primary"
			></div>
			<p class="text-lg text-theme-text">Verifiziere deine Zahlung...</p>
		{:else}
			<div class="mb-8">
				<div
					class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
				>
					<svg
						class="h-12 w-12 text-green-600 dark:text-green-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
			</div>

			<h1 class="mb-4 text-3xl font-bold text-theme-text">Willkommen bei ulo.ad Pro! 🎉</h1>
			<p class="mb-8 text-lg text-theme-text-muted">
				Dein Upgrade war erfolgreich. Du hast jetzt Zugriff auf alle Pro Features!
			</p>

			<div class="mb-8 rounded-lg border border-theme-border bg-theme-surface p-6">
				<h2 class="mb-3 font-semibold text-theme-text">Was du jetzt kannst:</h2>
				<ul class="space-y-2 text-left">
					<li class="flex items-start gap-2">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-theme-text">Unbegrenzt Links erstellen</span>
					</li>
					<li class="flex items-start gap-2">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-theme-text">Erweiterte Analytics nutzen</span>
					</li>
					<li class="flex items-start gap-2">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-theme-text">Custom QR Codes erstellen</span>
					</li>
					<li class="flex items-start gap-2">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-theme-text">Priority Support erhalten</span>
					</li>
				</ul>
			</div>

			<div class="flex justify-center gap-4">
				<a
					href="/dashboard"
					class="rounded-lg bg-theme-primary px-6 py-3 font-medium text-white transition-colors hover:bg-theme-primary-hover"
				>
					Zum Dashboard
				</a>
				<a
					href="/account"
					class="rounded-lg border border-theme-border bg-theme-surface px-6 py-3 font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
				>
					Account verwalten
				</a>
			</div>
		{/if}
	</div>
</div>
