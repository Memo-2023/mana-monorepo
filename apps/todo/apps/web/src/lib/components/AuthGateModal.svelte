<script lang="ts">
	import { goto } from '$app/navigation';
	import { sessionTasksStore } from '$lib/stores/session-tasks.svelte';

	interface Props {
		visible: boolean;
		onClose: () => void;
		action?: 'save' | 'sync' | 'feature';
		featureName?: string;
	}

	let { visible, onClose, action = 'save', featureName = '' }: Props = $props();

	// Action-specific messages
	const messages = {
		save: {
			title: 'Anmelden um zu speichern',
			description:
				'Melde dich an, um deine Aufgaben in der Cloud zu speichern und auf allen Geräten zu synchronisieren.',
			icon: 'cloud',
		},
		sync: {
			title: 'Anmelden für Cloud-Sync',
			description:
				'Mit einem Account werden deine Aufgaben automatisch synchronisiert und bleiben erhalten.',
			icon: 'refresh-cw',
		},
		feature: {
			title: `Anmelden für ${featureName}`,
			description: `Diese Funktion erfordert ein Konto. Melde dich an, um ${featureName} zu nutzen.`,
			icon: 'lock',
		},
	};

	let currentMessage = $derived(messages[action]);
	let sessionTaskCount = $derived(sessionTasksStore.count);

	function handleLogin() {
		// Store return URL for redirect after login
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem('auth-return-url', window.location.pathname);
		}
		goto('/login');
	}

	function handleRegister() {
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem('auth-return-url', window.location.pathname);
		}
		goto('/register');
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[9995] flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
	>
		<div
			class="bg-card border-border mx-4 w-full max-w-md rounded-xl border p-6 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="auth-gate-title"
		>
			<!-- Icon -->
			<div
				class="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
			>
				{#if currentMessage.icon === 'cloud'}
					<svg class="text-primary h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
				{:else if currentMessage.icon === 'refresh-cw'}
					<svg class="text-primary h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				{:else}
					<svg class="text-primary h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
				{/if}
			</div>

			<!-- Title -->
			<h2 id="auth-gate-title" class="mb-2 text-center text-xl font-semibold">
				{currentMessage.title}
			</h2>

			<!-- Description -->
			<p class="text-muted-foreground mb-6 text-center text-sm">
				{currentMessage.description}
			</p>

			<!-- Session tasks info -->
			{#if sessionTaskCount > 0}
				<div class="bg-muted/50 mb-6 rounded-lg p-3 text-center text-sm">
					<span class="text-muted-foreground">
						Du hast <strong class="text-foreground">{sessionTaskCount}</strong>
						{sessionTaskCount === 1 ? 'Aufgabe' : 'Aufgaben'} in dieser Sitzung erstellt.
					</span>
					<br />
					<span class="text-muted-foreground text-xs">
						Diese werden nach der Anmeldung in deinen Account übernommen.
					</span>
				</div>
			{/if}

			<!-- Buttons -->
			<div class="flex flex-col gap-3">
				<button
					onclick={handleLogin}
					class="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-4 py-3 font-medium transition-colors"
				>
					Anmelden
				</button>
				<button
					onclick={handleRegister}
					class="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full rounded-lg px-4 py-3 font-medium transition-colors"
				>
					Kostenloses Konto erstellen
				</button>
				<button
					onclick={onClose}
					class="text-muted-foreground hover:text-foreground w-full py-2 text-sm transition-colors"
				>
					Später
				</button>
			</div>

			<!-- Info text -->
			<p class="text-muted-foreground mt-4 text-center text-xs">
				Du kannst weiterhin Aufgaben erstellen. Diese werden lokal gespeichert und gehen beim
				Schließen des Tabs verloren.
			</p>
		</div>
	</div>
{/if}
