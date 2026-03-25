<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { profileService } from '$lib/api/profile';

	let { nameValue = $bindable('') }: { nameValue?: string } = $props();

	let name = $state(authStore.user?.name || '');

	// Sync name to parent via bindable
	$effect(() => {
		nameValue = name;
	});
	let avatarPreview = $state<string | null>(authStore.user?.image || null);
	let selectedFile = $state<File | null>(null);
	let saving = $state(false);
	let saved = $state(false);
	let error = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		if (!file.type.startsWith('image/')) {
			error = 'Bitte wähle ein Bild aus';
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			error = 'Max. 5MB erlaubt';
			return;
		}

		selectedFile = file;
		error = null;

		const reader = new FileReader();
		reader.onload = (e) => {
			avatarPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	async function saveProfile() {
		if (!name.trim()) {
			error = 'Bitte gib deinen Namen ein';
			return;
		}

		saving = true;
		error = null;

		try {
			// Upload avatar if selected
			if (selectedFile) {
				await profileService.uploadAvatar(selectedFile);
			}

			// Update name
			await profileService.updateProfile({ name: name.trim() });
			saved = true;

			// Refresh auth store
			// The profile update should update the user in authStore
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Speichern';
		} finally {
			saving = false;
		}
	}

	function getInitials(name: string): string {
		return (
			name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2) || 'U'
		);
	}
</script>

<div class="max-w-md mx-auto">
	<div class="text-center mb-8">
		<h2 class="text-2xl font-bold mb-2">Vervollständige dein Profil</h2>
		<p class="text-muted-foreground">Füge ein Profilbild und deinen Namen hinzu.</p>
	</div>

	<div class="space-y-6">
		<!-- Avatar Upload -->
		<div class="flex flex-col items-center">
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				class="hidden"
				onchange={handleFileSelect}
			/>

			<button onclick={triggerFileInput} class="relative group">
				{#if avatarPreview}
					<img
						src={avatarPreview}
						alt="Avatar"
						class="h-28 w-28 rounded-full object-cover border-4 border-border group-hover:border-primary/50 transition-colors"
					/>
				{:else}
					<div
						class="h-28 w-28 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-semibold border-4 border-border group-hover:border-primary/50 transition-colors"
					>
						{getInitials(name || 'U')}
					</div>
				{/if}

				<!-- Camera overlay -->
				<div
					class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
				>
					<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
			</button>

			<p class="mt-2 text-sm text-muted-foreground">Klicke zum Ändern</p>
		</div>

		<!-- Name Input -->
		<div>
			<label for="onboarding-name" class="block text-sm font-medium mb-2">Dein Name</label>
			<input
				id="onboarding-name"
				type="text"
				bind:value={name}
				placeholder="Max Mustermann"
				class="w-full px-4 py-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
			/>
		</div>

		<!-- Email (readonly) -->
		<div>
			<label class="block text-sm font-medium mb-2 text-muted-foreground">E-Mail</label>
			<div class="px-4 py-3 border rounded-xl bg-muted text-muted-foreground">
				{authStore.user?.email || 'Nicht verfügbar'}
			</div>
		</div>

		{#if error}
			<div
				class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
			>
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			</div>
		{/if}

		{#if saved}
			<div
				class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
			>
				<p class="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Profil gespeichert!
				</p>
			</div>
		{:else}
			<button
				onclick={saveProfile}
				disabled={saving || !name.trim()}
				class="w-full px-4 py-3 bg-card border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
			>
				{#if saving}
					<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						></path>
					</svg>
					Speichern...
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Jetzt speichern
				{/if}
			</button>
		{/if}

		<p class="text-center text-sm text-muted-foreground">
			Du kannst dein Profil jederzeit in den Einstellungen ändern.
		</p>
	</div>
</div>
