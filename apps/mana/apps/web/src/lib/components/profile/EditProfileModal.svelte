<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { profileService, type UserProfile } from '$lib/api/profile';
	import { PencilSimple } from '@mana/shared-icons';

	interface Props {
		show: boolean;
		user: UserProfile | null;
		onClose: () => void;
		onSuccess: (user: UserProfile) => void;
	}

	let { show, user, onClose, onSuccess }: Props = $props();

	let name = $state('');
	let newEmail = $state('');
	let editingEmail = $state(false);
	let emailSent = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	// Initialize form when modal opens
	$effect(() => {
		if (show && user) {
			name = user.name || '';
			newEmail = '';
			editingEmail = false;
			emailSent = false;
			error = null;
		}
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !saving) {
			onClose();
		}
	}

	function openMeImages() {
		onClose();
		goto('/profile/me-images');
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
			// Avatar is now managed exclusively via /profile/me-images (plan
			// M2.5): setting a primary face in meImages syncs the URL back
			// to auth.users.image. This modal only covers the name here.
			const result = await profileService.updateProfile({ name: name.trim() });
			onSuccess(result.user);
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : $_('common.error_saving');
		} finally {
			saving = false;
		}
	}

	async function handleChangeEmail() {
		if (!newEmail.trim()) {
			error = 'Bitte gib eine neue E-Mail-Adresse ein';
			return;
		}
		if (newEmail.trim() === user?.email) {
			error = 'Die neue E-Mail-Adresse muss sich von der aktuellen unterscheiden';
			return;
		}
		saving = true;
		error = null;
		try {
			await profileService.changeEmail({ newEmail: newEmail.trim() });
			emailSent = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Ändern der E-Mail';
		} finally {
			saving = false;
		}
	}

	// Get initials for avatar placeholder
	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && !saving && onClose()}
		tabindex="-1"
		role="presentation"
	>
		<div
			class="bg-card rounded-t-xl sm:rounded-xl shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh]"
			role="dialog"
			aria-modal="true"
		>
			<div class="p-6">
				<div class="flex items-center gap-3 mb-6">
					<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
						<PencilSimple size={20} class="text-primary" />
					</div>
					<h3 class="text-lg font-semibold">Profil bearbeiten</h3>
				</div>

				<form onsubmit={handleSubmit}>
					<div class="space-y-4">
						<!-- Profilbild (read-only preview + link to Meine Bilder) -->
						<div>
							<span class="block text-sm font-medium mb-2">Profilbild</span>
							<div class="flex items-center gap-4">
								{#if user?.image}
									<img
										src={user.image}
										alt="Avatar"
										class="h-20 w-20 rounded-full object-cover border-2 border-border"
									/>
								{:else}
									<div
										class="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold"
									>
										{getInitials(name || user?.name || 'U')}
									</div>
								{/if}
								<div class="flex flex-col gap-1">
									<button
										type="button"
										onclick={openMeImages}
										disabled={saving}
										class="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 text-left"
									>
										In „Meine Bilder" verwalten →
									</button>
									<p class="text-xs text-muted-foreground">
										Dein Profilbild folgt dem Gesichts-Primärbild unter Meine Bilder.
									</p>
								</div>
							</div>
						</div>

						<!-- Email -->
						<div>
							<label for="profile-email" class="block text-sm font-medium mb-2">E-Mail</label>
							{#if editingEmail}
								{#if emailSent}
									<div
										class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
									>
										<p class="text-sm text-green-700 dark:text-green-300">
											Bestätigungs-E-Mail an <strong>{newEmail}</strong> gesendet. Bitte klicke den Link
											in der E-Mail, um die Änderung abzuschließen.
										</p>
									</div>
									<button
										type="button"
										onclick={() => {
											editingEmail = false;
											emailSent = false;
										}}
										class="mt-2 text-sm text-primary hover:underline"
									>
										Zurück
									</button>
								{:else}
									<div class="flex gap-2">
										<input
											id="profile-email"
											type="email"
											bind:value={newEmail}
											disabled={saving}
											placeholder="Neue E-Mail-Adresse"
											class="flex-1 px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
										/>
										<button
											type="button"
											onclick={handleChangeEmail}
											disabled={saving || !newEmail.trim()}
											class="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
										>
											{saving ? 'Senden...' : 'Bestätigen'}
										</button>
									</div>
									<button
										type="button"
										onclick={() => {
											editingEmail = false;
											error = null;
										}}
										class="mt-1 text-xs text-muted-foreground hover:text-foreground"
									>
										Abbrechen
									</button>
								{/if}
							{:else}
								<div class="flex gap-2">
									<input
										id="profile-email"
										type="email"
										value={user?.email || ''}
										disabled
										class="flex-1 px-3 py-2 border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
									/>
									<button
										type="button"
										onclick={() => {
											editingEmail = true;
											newEmail = '';
											error = null;
										}}
										disabled={saving}
										class="px-3 py-2 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 whitespace-nowrap"
									>
										Ändern
									</button>
								</div>
								<p class="mt-1 text-xs text-muted-foreground">
									Eine Bestätigungs-E-Mail wird an die neue Adresse gesendet
								</p>
							{/if}
						</div>

						<!-- Name -->
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
							<div
								class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
							>
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
							{$_('common.cancel')}
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
								<span>{$_('common.saving')}</span>
							{:else}
								{$_('common.save')}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
