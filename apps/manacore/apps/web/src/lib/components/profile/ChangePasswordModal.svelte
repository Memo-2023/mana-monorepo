<script lang="ts">
	import { profileService } from '$lib/api/profile';

	interface Props {
		show: boolean;
		onClose: () => void;
		onSuccess: () => void;
	}

	let { show, onClose, onSuccess }: Props = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let saving = $state(false);
	let error = $state<string | null>(null);
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);

	// Reset form when modal opens
	$effect(() => {
		if (show) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			error = null;
			showCurrentPassword = false;
			showNewPassword = false;
		}
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !saving) {
			onClose();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		// Validation
		if (!currentPassword) {
			error = 'Bitte gib dein aktuelles Passwort ein';
			return;
		}
		if (!newPassword) {
			error = 'Bitte gib ein neues Passwort ein';
			return;
		}
		if (newPassword.length < 8) {
			error = 'Das neue Passwort muss mindestens 8 Zeichen lang sein';
			return;
		}
		if (newPassword !== confirmPassword) {
			error = 'Die Passwörter stimmen nicht überein';
			return;
		}

		saving = true;
		error = null;

		try {
			await profileService.changePassword({
				currentPassword,
				newPassword,
			});
			onSuccess();
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Ändern des Passworts';
		} finally {
			saving = false;
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
				<div class="flex items-center gap-3 mb-6">
					<div
						class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
					>
						<svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold">Passwort ändern</h3>
				</div>

				<form onsubmit={handleSubmit}>
					<div class="space-y-4">
						<div>
							<label for="current-password" class="block text-sm font-medium mb-2">
								Aktuelles Passwort
							</label>
							<div class="relative">
								<input
									id="current-password"
									type={showCurrentPassword ? 'text' : 'password'}
									bind:value={currentPassword}
									disabled={saving}
									class="w-full px-3 py-2 pr-10 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
								/>
								<button
									type="button"
									onclick={() => (showCurrentPassword = !showCurrentPassword)}
									class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
								>
									{#if showCurrentPassword}
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
										</svg>
									{:else}
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									{/if}
								</button>
							</div>
						</div>

						<div>
							<label for="new-password" class="block text-sm font-medium mb-2">
								Neues Passwort
							</label>
							<div class="relative">
								<input
									id="new-password"
									type={showNewPassword ? 'text' : 'password'}
									bind:value={newPassword}
									disabled={saving}
									placeholder="Mindestens 8 Zeichen"
									class="w-full px-3 py-2 pr-10 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
								/>
								<button
									type="button"
									onclick={() => (showNewPassword = !showNewPassword)}
									class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
								>
									{#if showNewPassword}
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
										</svg>
									{:else}
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									{/if}
								</button>
							</div>
						</div>

						<div>
							<label for="confirm-password" class="block text-sm font-medium mb-2">
								Passwort bestätigen
							</label>
							<input
								id="confirm-password"
								type="password"
								bind:value={confirmPassword}
								disabled={saving}
								placeholder="Neues Passwort wiederholen"
								class="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
							/>
						</div>

						{#if error}
							<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
								<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
							</div>
						{/if}
					</div>

					<div class="flex gap-3 mt-6">
						<button
							type="button"
							onclick={onClose}
							disabled={saving}
							class="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
						>
							Abbrechen
						</button>
						<button
							type="submit"
							disabled={saving}
							class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
						>
							{#if saving}
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
								<span>Ändern...</span>
							{:else}
								Passwort ändern
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
