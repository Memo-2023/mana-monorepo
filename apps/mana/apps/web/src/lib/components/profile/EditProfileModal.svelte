<script lang="ts">
	import { _ } from 'svelte-i18n';
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
	let uploadingAvatar = $state(false);
	let error = $state<string | null>(null);
	let avatarPreview = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);

	// File input ref
	let fileInput = $state<HTMLInputElement | undefined>(undefined);

	// Initialize form when modal opens
	$effect(() => {
		if (show && user) {
			name = user.name || '';
			newEmail = '';
			editingEmail = false;
			emailSent = false;
			avatarPreview = user.image || null;
			selectedFile = null;
			error = null;
		}
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !saving && !uploadingAvatar) {
			onClose();
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			error = 'Bitte wähle ein Bild aus (JPG, PNG, GIF, WebP)';
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = 'Das Bild darf maximal 5MB groß sein';
			return;
		}

		selectedFile = file;
		error = null;

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			avatarPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	function removeAvatar() {
		selectedFile = null;
		avatarPreview = null;
		if (fileInput) {
			fileInput.value = '';
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
			let updatedUser: UserProfile;

			// If new avatar selected, upload first
			if (selectedFile) {
				uploadingAvatar = true;
				const result = await profileService.uploadAvatar(selectedFile);
				updatedUser = result.user;
				uploadingAvatar = false;

				// Now update name if changed
				if (name.trim() !== updatedUser.name) {
					const nameResult = await profileService.updateProfile({ name: name.trim() });
					updatedUser = nameResult.user;
				}
			} else if (avatarPreview === null && user?.image) {
				// Avatar was removed
				const result = await profileService.updateProfile({
					name: name.trim(),
					image: '',
				});
				updatedUser = result.user;
			} else {
				// Just update name
				const result = await profileService.updateProfile({ name: name.trim() });
				updatedUser = result.user;
			}

			onSuccess(updatedUser);
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : $_('common.error_saving');
		} finally {
			saving = false;
			uploadingAvatar = false;
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
		onkeydown={(e) => e.key === 'Escape' && !saving && !uploadingAvatar && onClose()}
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
						<!-- Avatar Upload -->
						<div>
							<span class="block text-sm font-medium mb-2">Profilbild</span>
							<div class="flex items-center gap-4">
								<!-- Avatar Preview -->
								<div class="relative">
									{#if avatarPreview}
										<img
											src={avatarPreview}
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

									{#if uploadingAvatar}
										<div
											class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
										>
											<svg class="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
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
										</div>
									{/if}
								</div>

								<!-- Upload/Remove Buttons -->
								<div class="flex flex-col gap-2">
									<input
										bind:this={fileInput}
										type="file"
										accept="image/*"
										class="hidden"
										onchange={handleFileSelect}
									/>
									<button
										type="button"
										onclick={triggerFileInput}
										disabled={saving || uploadingAvatar}
										class="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
									>
										Bild auswählen
									</button>
									{#if avatarPreview}
										<button
											type="button"
											onclick={removeAvatar}
											disabled={saving || uploadingAvatar}
											class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
										>
											Entfernen
										</button>
									{/if}
								</div>
							</div>
							<p class="mt-2 text-xs text-muted-foreground">JPG, PNG, GIF oder WebP. Max. 5MB.</p>
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
										disabled={saving || uploadingAvatar}
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
								disabled={saving || uploadingAvatar}
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
							disabled={saving || uploadingAvatar}
							class="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
						>
							{$_('common.cancel')}
						</button>
						<button
							type="submit"
							disabled={saving || uploadingAvatar}
							class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
						>
							{#if saving || uploadingAvatar}
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
								<span>{uploadingAvatar ? $_('common.uploading') : $_('common.saving')}</span>
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
