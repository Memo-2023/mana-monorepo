<script lang="ts">
	import { onMount } from 'svelte';
	import { ProfilePage } from '@manacore/shared-profile-ui';
	import type { UserProfile, ProfileActions } from '@manacore/shared-profile-ui';
	import { auth } from '$lib/stores/auth.svelte';
	import { decksStore } from '$lib/stores/decks.svelte';
	import { goto } from '$app/navigation';
	import { FolderOpen, Layers, Calendar } from 'lucide-svelte';

	let isLoading = $state(true);

	// Map auth store user to UserProfile
	let userProfile = $derived<UserProfile>({
		id: auth.user?.id || '',
		email: auth.user?.email || '',
		role: auth.user?.role,
	});

	// Profile actions
	const actions: ProfileActions = {
		onLogout: async () => {
			await auth.logout();
			goto('/login');
		},
		onDeleteAccount: () => {
			alert('Konto löschen ist noch nicht implementiert.');
		},
	};

	onMount(async () => {
		await decksStore.loadDecks();
		isLoading = false;
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		});
	}
</script>

<ProfilePage
	user={userProfile}
	appName="Presi"
	{actions}
	pageTitle="Profil"
	accountInfoTitle="Konto-Informationen"
	actionsTitle="Aktionen"
	emailLabel="E-Mail"
	nameLabel="Name"
	memberSinceLabel="Mitglied seit"
	lastLoginLabel="Letzter Login"
	roleLabel="Rolle"
	editProfileLabel="Profil bearbeiten"
	changePasswordLabel="Passwort ändern"
	logoutLabel="Abmelden"
	deleteAccountLabel="Konto löschen"
	deleteAccountWarning="Diese Aktion kann nicht rückgängig gemacht werden."
/>

<!-- Stats Section -->
<div class="mx-auto max-w-xl px-4 pb-8">
	{#if isLoading}
		<div class="flex items-center justify-center py-8">
			<div
				class="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else}
		<!-- Stats Card -->
		<section class="mb-6">
			<h2 class="text-lg font-semibold text-foreground mb-4">Statistiken</h2>
			<div
				class="p-5 rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-sm"
			>
				<div class="grid grid-cols-2 gap-4">
					<div class="text-center p-4 bg-black/5 dark:bg-white/5 rounded-xl">
						<div class="flex justify-center mb-2">
							<FolderOpen class="w-6 h-6 text-primary" />
						</div>
						<div class="text-2xl font-bold text-foreground">
							{decksStore.decks.length}
						</div>
						<div class="text-sm text-muted-foreground">Präsentationen</div>
					</div>
					<div class="text-center p-4 bg-black/5 dark:bg-white/5 rounded-xl">
						<div class="flex justify-center mb-2">
							<Layers class="w-6 h-6 text-primary" />
						</div>
						<div class="text-2xl font-bold text-foreground">-</div>
						<div class="text-sm text-muted-foreground">Folien</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Recent Presentations -->
		{#if decksStore.decks.length > 0}
			<section>
				<h2 class="text-lg font-semibold text-foreground mb-4">Letzte Präsentationen</h2>
				<div
					class="rounded-2xl bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden"
				>
					<div class="divide-y divide-black/10 dark:divide-white/10">
						{#each decksStore.decks.slice(0, 5) as deck (deck.id)}
							<a
								href="/deck/{deck.id}"
								class="flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"
									>
										<FolderOpen class="w-5 h-5 text-primary" />
									</div>
									<div>
										<h4 class="font-medium text-foreground">{deck.title}</h4>
										{#if deck.description}
											<p class="text-sm text-muted-foreground truncate max-w-xs">
												{deck.description}
											</p>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<Calendar class="w-4 h-4" />
									{formatDate(deck.updatedAt)}
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>
		{/if}
	{/if}
</div>
