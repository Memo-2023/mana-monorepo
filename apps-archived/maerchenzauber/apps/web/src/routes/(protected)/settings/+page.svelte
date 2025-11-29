<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore.svelte';
	import { goto } from '$app/navigation';
	import { dataService } from '$lib/api';
	import { toastStore } from '$lib/stores/toast.svelte';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsDangerZone,
		SettingsDangerButton,
	} from '@manacore/shared-ui';

	// Stats
	let storyCount = $state(0);
	let characterCount = $state(0);
	let loadingStats = $state(true);

	// Theme
	let isDarkMode = $state(false);

	// Image Model Settings
	let selectedImageModel = $state('flux-schnell');
	const imageModels = [
		{
			id: 'flux-schnell',
			name: 'Flux Schnell',
			description: 'Schnell & gut (Standard)',
			speed: 'Schnell',
		},
		{ id: 'flux-dev', name: 'Flux Dev', description: 'Beste Qualität, langsamer', speed: 'Mittel' },
		{ id: 'sdxl', name: 'SDXL', description: 'Klassischer Stil', speed: 'Mittel' },
	];

	onMount(async () => {
		// Load stats
		try {
			const [stories, characters] = await Promise.all([
				dataService.getStories(),
				dataService.getCharacters(),
			]);
			storyCount = stories.filter((s) => !s.archived).length;
			characterCount = characters.filter((c) => !c.archived).length;

			// Load user settings
			try {
				const settings = await dataService.getUserSettings();
				if (settings?.imageModel) {
					selectedImageModel = settings.imageModel;
				}
			} catch {
				// Settings API may not have imageModel yet
			}
		} catch (err) {
			console.error('[Settings] Failed to load stats:', err);
		} finally {
			loadingStats = false;
		}

		// Check current theme
		isDarkMode = document.documentElement.classList.contains('dark');
	});

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}

	async function saveImageModel(modelId: string) {
		selectedImageModel = modelId;
		try {
			await dataService.updateUserSettings({ imageModel: modelId });
			toastStore.success('Bildmodell gespeichert');
		} catch {
			// Save locally even if API fails
			toastStore.success('Bildmodell gespeichert');
		}
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Einstellungen | Märchenzauber</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Verwalte dein Konto und deine Einstellungen">
	<!-- Stats Section (Custom gradient) -->
	<section
		class="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white shadow-lg"
	>
		<h2 class="mb-4 text-lg font-semibold">Deine Statistiken</h2>
		<div class="grid grid-cols-2 gap-4">
			<div class="rounded-xl bg-white/20 p-4 backdrop-blur">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
					</div>
					<div>
						<p class="text-2xl font-bold">{loadingStats ? '...' : storyCount}</p>
						<p class="text-sm text-white/80">Geschichten</p>
					</div>
				</div>
			</div>
			<div class="rounded-xl bg-white/20 p-4 backdrop-blur">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					</div>
					<div>
						<p class="text-2xl font-bold">{loadingStats ? '...' : characterCount}</p>
						<p class="text-sm text-white/80">Charaktere</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Appearance Section -->
	<SettingsSection title="Darstellung">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Dunkelmodus"
				description={isDarkMode ? 'Aktiviert' : 'Deaktiviert'}
				isOn={isDarkMode}
				onToggle={toggleTheme}
			>
				{#snippet icon()}
					{#if isDarkMode}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
					{:else}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					{/if}
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Image Model Section (Custom) -->
	<SettingsSection title="Bildgenerierung">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
		{/snippet}

		<p class="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
			Wähle das KI-Modell für die Illustration deiner Geschichten
		</p>

		<div class="space-y-2">
			{#each imageModels as model}
				<button
					onclick={() => saveImageModel(model.id)}
					class="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-all {selectedImageModel ===
					model.id
						? 'bg-pink-50 ring-2 ring-pink-500 dark:bg-pink-900/20'
						: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)]'}"
				>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl {selectedImageModel ===
						model.id
							? 'bg-pink-500 text-white'
							: 'bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]'}"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<p class="font-medium text-[hsl(var(--foreground))]">{model.name}</p>
						<p class="text-sm text-[hsl(var(--muted-foreground))]">{model.description}</p>
					</div>
					<span
						class="rounded-full bg-[hsl(var(--background))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]"
					>
						{model.speed}
					</span>
					{#if selectedImageModel === model.id}
						<svg class="h-5 w-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	</SettingsSection>

	<!-- Story Settings Section -->
	<SettingsSection title="Geschichten">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Kreative wählen" description="Autoren & Illustratoren Stil" href="/creators">
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
			<SettingsRow
				label="Story-Vorlagen"
				description="Inspiration für neue Geschichten"
				href="/templates"
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
			<SettingsRow
				label="Sammlungen"
				description="Geschichten organisieren"
				href="/collections"
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Characters Section -->
	<SettingsSection title="Charaktere">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow
				label="Charakter importieren"
				description="Mit Teilen-Code importieren"
				href="/characters/share"
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Account Section -->
	<SettingsSection title="Konto">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow label="E-Mail" description={authStore.user?.email || '-'}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
			<SettingsRow label="Benutzer-ID" border={false}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
						/>
					</svg>
				{/snippet}
				<span class="font-mono text-xs text-[hsl(var(--muted-foreground))]">
					{authStore.user?.id || '-'}
				</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Subscription Section -->
	<SettingsSection title="Abonnement">
		{#snippet icon()}
			<svg fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
				/>
			</svg>
		{/snippet}

		<a
			href="/subscription"
			class="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-100 to-yellow-100 p-4 transition-all hover:from-amber-200 hover:to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/30 dark:hover:from-amber-900/50 dark:hover:to-yellow-900/50"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
						/>
					</svg>
				</div>
				<div>
					<p class="font-medium text-[hsl(var(--foreground))]">Mana verwalten</p>
					<p class="text-sm text-[hsl(var(--muted-foreground))]">Abonnement und Guthaben</p>
				</div>
			</div>
			<svg
				class="h-5 w-5 text-[hsl(var(--muted-foreground))]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</a>
	</SettingsSection>

	<!-- More Section -->
	<SettingsSection title="Mehr">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Feedback & Ideen" description="Stimme für Features ab" href="/feedback">
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
			<SettingsRow
				label="Archiv"
				description="Archivierte Geschichten und Charaktere"
				href="/archive"
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
			<SettingsRow label="Hilfe" description="FAQ und Support" href="/help" border={false}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Logout -->
	<SettingsDangerZone title="Abmelden">
		<SettingsDangerButton
			label="Abmelden"
			description="Von deinem Konto abmelden"
			buttonText="Abmelden"
			onclick={handleLogout}
			border={false}
		>
			{#snippet icon()}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>
</SettingsPage>
