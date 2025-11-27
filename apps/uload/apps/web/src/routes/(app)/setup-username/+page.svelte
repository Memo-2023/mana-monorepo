<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { validateUsername, RESERVED_USERNAMES } from '$lib/username';
	import { toastMessages } from '$lib/services/toast';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let isSubmitting = $state(false);
	let username = $state('');
	let isChecking = $state(false);
	let validationMessage = $state('');
	let isValid = $state(false);

	// Debounced username validation
	let debounceTimer: ReturnType<typeof setTimeout>;

	function checkUsername(value: string) {
		clearTimeout(debounceTimer);
		validationMessage = '';
		isValid = false;

		if (!value) {
			return;
		}

		// Local validation first
		const validation = validateUsername(value);
		if (!validation.valid) {
			validationMessage = validation.error || '';
			return;
		}

		// Check availability after debounce
		isChecking = true;
		debounceTimer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/check-username?username=${encodeURIComponent(value)}`);
				const result = await response.json();

				if (result.available) {
					validationMessage = '✓ Username verfügbar';
					isValid = true;
				} else {
					validationMessage = 'Dieser Username ist bereits vergeben';
					isValid = false;
				}
			} catch (error) {
				validationMessage = 'Fehler beim Überprüfen';
				isValid = false;
			} finally {
				isChecking = false;
			}
		}, 500);
	}

	$effect(() => {
		checkUsername(username);
	});
</script>

<div class="min-h-screen bg-theme-background">
	<div class="mx-auto max-w-2xl px-4 py-16">
		<div class="rounded-xl bg-white p-8 shadow-xl dark:bg-theme-surface">
			<div class="mb-8 text-center">
				<h1 class="text-3xl font-bold text-theme-text dark:text-white">Wähle deinen Username</h1>
				<p class="mt-3 text-theme-text-muted">
					Dies ist deine einmalige Chance, deinen Username zu wählen. Nach der Bestätigung kann er
					nicht mehr geändert werden.
				</p>
			</div>

			<form
				method="POST"
				action="?/setUsername"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						if (result.type === 'failure') {
							// Show error toast
							if (result.data?.error) {
								toastMessages.genericError(result.data.error);
							}
							await update();
							isSubmitting = false;
						} else if (result.type === 'redirect') {
							// Let the redirect happen
						} else if (result.type === 'success' && result.data?.success) {
							// Show success toast and redirect
							toastMessages.usernameSet(username);
							setTimeout(() => {
								window.location.href = '/my';
							}, 1500);
						} else {
							await update();
							isSubmitting = false;
						}
					};
				}}
			>
				<div class="space-y-6">
					<div>
						<label
							for="username"
							class="mb-2 block text-sm font-medium text-theme-text dark:text-theme-text"
						>
							Username
						</label>
						<div class="relative">
							<input
								type="text"
								id="username"
								name="username"
								bind:value={username}
								required
								minlength="3"
								maxlength="30"
								pattern="[a-zA-Z0-9_\-]+"
								placeholder="dein-username"
								class="w-full rounded-lg border border-theme-border bg-theme-surface px-4 py-3 text-lg text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
							/>
							{#if isChecking}
								<div class="absolute right-3 top-1/2 -translate-y-1/2">
									<svg
										class="h-5 w-5 animate-spin text-theme-primary"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
										></path>
									</svg>
								</div>
							{/if}
						</div>

						{#if validationMessage}
							<p class="mt-2 text-sm {isValid ? 'text-green-600' : 'text-red-600'}">
								{validationMessage}
							</p>
						{/if}

						<div class="mt-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
							<p class="text-sm text-blue-800 dark:text-blue-300">
								<strong>Deine Profil-URL wird sein:</strong><br />
								<code class="mt-1 block text-blue-900 dark:text-blue-200">
									{typeof window !== 'undefined' ? window.location.origin : ''}/p/{username ||
										'dein-username'}
								</code>
							</p>
						</div>
					</div>

					<div
						class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
					>
						<div class="flex">
							<svg
								class="h-5 w-5 text-amber-600 dark:text-amber-400"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clip-rule="evenodd"
								/>
							</svg>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-amber-800 dark:text-amber-200">
									Wichtiger Hinweis
								</h3>
								<p class="mt-2 text-sm text-amber-700 dark:text-amber-300">
									Nach der Bestätigung kann dein Username <strong>nie wieder geändert</strong> werden.
									Alle deine Links werden unter diesem Username erreichbar sein.
								</p>
							</div>
						</div>
					</div>

					<div class="space-y-3">
						<h3 class="text-sm font-medium text-theme-text dark:text-theme-text">
							Username-Regeln:
						</h3>
						<ul class="space-y-1 text-sm text-theme-text-muted">
							<li>• Mindestens 3, maximal 30 Zeichen</li>
							<li>• Nur Buchstaben, Zahlen, Unterstriche (_) und Bindestriche (-)</li>
							<li>• Muss mit einem Buchstaben oder einer Zahl beginnen</li>
							<li>• Keine Leerzeichen oder Sonderzeichen</li>
						</ul>
					</div>

					<button
						type="submit"
						disabled={isSubmitting || !isValid || isChecking}
						class="w-full rounded-lg bg-theme-primary px-6 py-3 font-medium text-white transition-colors hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isSubmitting}
							Username wird gesetzt...
						{:else}
							Username bestätigen
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
