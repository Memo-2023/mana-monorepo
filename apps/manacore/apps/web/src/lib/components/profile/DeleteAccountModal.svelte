<script lang="ts">
	import { profileService } from '$lib/api/profile';
	import { Warning, XCircle } from '@manacore/shared-icons';

	interface Props {
		show: boolean;
		userEmail: string;
		onClose: () => void;
		onSuccess: () => void;
	}

	let { show, userEmail, onClose, onSuccess }: Props = $props();

	let password = $state('');
	let reason = $state('');
	let confirmEmail = $state('');
	let deleting = $state(false);
	let error = $state<string | null>(null);
	let step = $state<'confirm' | 'password'>('confirm');

	// Reset form when modal opens
	$effect(() => {
		if (show) {
			password = '';
			reason = '';
			confirmEmail = '';
			error = null;
			step = 'confirm';
		}
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !deleting) {
			onClose();
		}
	}

	function handleContinue() {
		if (confirmEmail !== userEmail) {
			error = 'Die E-Mail-Adresse stimmt nicht überein';
			return;
		}
		error = null;
		step = 'password';
	}

	async function handleDelete() {
		if (!password) {
			error = 'Bitte gib dein Passwort ein';
			return;
		}

		deleting = true;
		error = null;

		try {
			await profileService.deleteAccount({
				password,
				reason: reason || undefined,
			});
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Löschen des Kontos';
		} finally {
			deleting = false;
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
	>
		<div class="bg-card rounded-xl shadow-xl max-w-md w-full" role="dialog" aria-modal="true">
			<div class="p-6">
				<div class="flex items-center gap-3 mb-4">
					<div
						class="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
					>
						<Warning size={20} class="text-red-600" />
					</div>
					<h3 class="text-lg font-semibold text-red-600">Konto löschen</h3>
				</div>

				{#if step === 'confirm'}
					<div
						class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
					>
						<p class="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
							Diese Aktion ist unwiderruflich!
						</p>
						<p class="text-sm text-red-600 dark:text-red-400">
							Dein Konto und alle deine Daten werden dauerhaft gelöscht. Dies umfasst:
						</p>
					</div>

					<ul class="text-sm text-muted-foreground mb-6 space-y-2">
						<li class="flex items-center gap-2">
							<XCircle size={16} weight="fill" class="text-red-500 flex-shrink-0" />
							<span>Alle Projektdaten (Chats, Todos, Termine, etc.)</span>
						</li>
						<li class="flex items-center gap-2">
							<XCircle size={16} weight="fill" class="text-red-500 flex-shrink-0" />
							<span>Alle verbleibenden Credits</span>
						</li>
						<li class="flex items-center gap-2">
							<XCircle size={16} weight="fill" class="text-red-500 flex-shrink-0" />
							<span>Dein aktives Abonnement (wird gekündigt)</span>
						</li>
						<li class="flex items-center gap-2">
							<XCircle size={16} weight="fill" class="text-red-500 flex-shrink-0" />
							<span>Dein Nutzerkonto</span>
						</li>
					</ul>

					<div class="mb-4">
						<label for="delete-confirm-email" class="block text-sm font-medium mb-2">
							Gib zur Bestätigung deine E-Mail-Adresse ein:
						</label>
						<input
							id="delete-confirm-email"
							type="email"
							placeholder={userEmail}
							bind:value={confirmEmail}
							class="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-red-500/50"
						/>
					</div>

					{#if error}
						<div
							class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
						>
							<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
						</div>
					{/if}

					<div class="flex gap-3">
						<button
							onclick={onClose}
							class="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
						>
							Abbrechen
						</button>
						<button
							onclick={handleContinue}
							disabled={confirmEmail !== userEmail}
							class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Weiter
						</button>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground mb-4">
						Bitte gib dein Passwort ein, um die Löschung zu bestätigen.
					</p>

					<div class="space-y-4">
						<div>
							<label for="delete-password" class="block text-sm font-medium mb-2">Passwort</label>
							<input
								id="delete-password"
								type="password"
								bind:value={password}
								disabled={deleting}
								placeholder="Dein aktuelles Passwort"
								class="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
							/>
						</div>

						<div>
							<label for="delete-reason" class="block text-sm font-medium mb-2">
								Grund für die Löschung (optional)
							</label>
							<textarea
								id="delete-reason"
								bind:value={reason}
								disabled={deleting}
								placeholder="Hilf uns, besser zu werden..."
								rows="2"
								class="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 resize-none"
							></textarea>
						</div>

						{#if error}
							<div
								class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
							>
								<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
							</div>
						{/if}
					</div>

					<div class="flex gap-3 mt-6">
						<button
							onclick={() => (step = 'confirm')}
							disabled={deleting}
							class="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
						>
							Zurück
						</button>
						<button
							onclick={handleDelete}
							disabled={deleting || !password}
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
								<span>Wird gelöscht...</span>
							{:else}
								Konto endgültig löschen
							{/if}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
