<script lang="ts">
	import type { DeleteUserDataResponse } from '$lib/api/services/admin';

	interface Props {
		show: boolean;
		userEmail: string;
		deleting: boolean;
		deleteResult: DeleteUserDataResponse | null;
		deleteError: string | null;
		onConfirm: () => void;
		onClose: () => void;
	}

	let { show, userEmail, deleting, deleteResult, deleteError, onConfirm, onClose }: Props =
		$props();

	let confirmEmail = $state('');

	function handleClose() {
		confirmEmail = '';
		onClose();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !deleting && !deleteResult) {
			handleClose();
		}
	}

	// Reset confirmEmail when modal opens
	$effect(() => {
		if (!show) {
			confirmEmail = '';
		}
	});
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
	>
		<div class="bg-card rounded-xl shadow-xl max-w-md w-full" role="dialog" aria-modal="true">
			{#if deleteResult}
				<!-- Success State -->
				<div class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div
							class="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
						>
							<svg
								class="h-5 w-5 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h3 class="text-lg font-semibold">Daten geloscht</h3>
					</div>

					<p class="text-sm text-muted-foreground mb-4">
						Dein Konto und alle damit verbundenen Daten wurden geloscht. Insgesamt wurden
						<strong>{deleteResult.totalDeleted}</strong> Eintrage entfernt.
					</p>

					<div class="space-y-2 mb-6 text-sm">
						{#each deleteResult.deletedFromProjects as project}
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">{project.projectName}</span>
								{#if project.success}
									<span class="text-green-600">{project.deletedCount || 0} geloscht</span>
								{:else}
									<span class="text-yellow-600">Nicht erreichbar</span>
								{/if}
							</div>
						{/each}
						<div class="pt-2 border-t mt-2">
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Sessions</span>
								<span>{deleteResult.deletedFromAuth.sessions}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Verknupfte Accounts</span>
								<span>{deleteResult.deletedFromAuth.accounts}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-muted-foreground">Credit-Transaktionen</span>
								<span>{deleteResult.deletedFromAuth.credits}</span>
							</div>
						</div>
					</div>

					<p class="text-sm text-muted-foreground mb-4">
						Du wirst automatisch ausgeloggt und zur Startseite weitergeleitet.
					</p>

					<button
						onclick={handleClose}
						class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					>
						Schliessen
					</button>
				</div>
			{:else}
				<!-- Confirmation State -->
				<div class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div
							class="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
						>
							<svg
								class="h-5 w-5 text-red-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-red-600">Alle Daten loschen?</h3>
					</div>

					<div
						class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
					>
						<p class="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
							Diese Aktion ist unwiderruflich!
						</p>
						<p class="text-sm text-red-600 dark:text-red-400">
							Dein Konto und alle deine Daten werden dauerhaft geloscht. Du wirst ausgeloggt und
							kannst dich nicht mehr anmelden.
						</p>
					</div>

					<p class="text-sm text-muted-foreground mb-4">Folgende Daten werden geloscht:</p>

					<ul class="text-sm text-muted-foreground mb-6 space-y-2">
						<li class="flex items-center gap-2">
							<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>Alle Projektdaten (Chats, Todos, Termine, Kontakte, etc.)</span>
						</li>
						<li class="flex items-center gap-2">
							<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>Alle Sessions und Anmeldedaten</span>
						</li>
						<li class="flex items-center gap-2">
							<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>Credits und Transaktionshistorie</span>
						</li>
						<li class="flex items-center gap-2">
							<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>Dein Nutzerkonto</span>
						</li>
					</ul>

					<div class="mb-4">
						<label for="delete-confirm-email" class="block text-sm font-medium mb-2">
							Gib zur Bestatigung deine Email-Adresse ein:
						</label>
						<input
							id="delete-confirm-email"
							type="email"
							placeholder={userEmail}
							bind:value={confirmEmail}
							disabled={deleting}
							class="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
						/>
					</div>

					{#if deleteError}
						<div
							class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
						>
							<p class="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
						</div>
					{/if}

					<div class="flex gap-3">
						<button
							onclick={handleClose}
							class="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
							disabled={deleting}
						>
							Abbrechen
						</button>
						<button
							onclick={onConfirm}
							disabled={deleting || confirmEmail !== userEmail}
							class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
						>
							{#if deleting}
								<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								<span>Wird geloscht...</span>
							{:else}
								Endgultig loschen
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
