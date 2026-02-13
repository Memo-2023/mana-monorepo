<script lang="ts">
	import { profileService, type UserProfile } from '$lib/api/profile';

	interface Props {
		show: boolean;
		user: UserProfile | null;
		onClose: () => void;
		onSuccess: (user: UserProfile) => void;
	}

	let { show, user, onClose, onSuccess }: Props = $props();

	let name = $state('');
	let saving = $state(false);
	let error = $state<string | null>(null);

	// Initialize form when modal opens
	$effect(() => {
		if (show && user) {
			name = user.name || '';
			error = null;
		}
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !saving) {
			onClose();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) {
			error = 'Name darf nicht leer sein';
			return;
		}

		saving = true;
		error = null;

		try {
			const result = await profileService.updateProfile({ name: name.trim() });
			onSuccess(result.user);
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Speichern';
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
						class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
					>
						<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold">Profil bearbeiten</h3>
				</div>

				<form onsubmit={handleSubmit}>
					<div class="space-y-4">
						<div>
							<label for="profile-email" class="block text-sm font-medium mb-2">E-Mail</label>
							<input
								id="profile-email"
								type="email"
								value={user?.email || ''}
								disabled
								class="w-full px-3 py-2 border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
							/>
							<p class="mt-1 text-xs text-muted-foreground">E-Mail kann nicht geändert werden</p>
						</div>

						<div>
							<label for="profile-name" class="block text-sm font-medium mb-2">Name</label>
							<input
								id="profile-name"
								type="text"
								bind:value={name}
								disabled={saving}
								placeholder="Dein Name"
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
								<span>Speichern...</span>
							{:else}
								Speichern
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
