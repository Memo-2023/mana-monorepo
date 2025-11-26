<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Card } from '$lib/components/cards/types';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	// State
	let card = $state<Card>({
		type: 'user',
		config: {
			mode: 'beginner',
			modules: [
				{
					id: 'header-default',
					type: 'header',
					order: 0,
					props: {
						title: 'Dein Name',
						subtitle: 'Deine Position',
						avatar: ''
					}
				},
				{
					id: 'links-default',
					type: 'links',
					order: 1,
					props: {
						links: [],
						style: 'button',
						layout: 'vertical'
					}
				}
			],
			layout: {
				padding: '2rem',
				gap: '1.5rem',
				maxWidth: '450px'
			},
			animations: {
				hover: true,
				entrance: 'fade'
			}
		},
		metadata: {
			name: 'Meine Card',
			description: ''
		},
		constraints: {},
		visibility: 'public',
		category: '',
		variant: '',
		user_id: '',
		usage_count: 0,
		likes_count: 0
	});

	let loading = $state(false);
	let saving = $state(false);
	let editingCard = $state<Card | null>(null);
	let userLinks = $state<any[]>([]);
	let loadingLinks = $state(false);
	let userAvatarUrl = $state<string>('');
	
	// Editing states
	let editingTitle = $state(false);
	let editingSubtitle = $state(false);
	let tempTitle = $state('');
	let tempSubtitle = $state('');
	let showLinkSelector = $state(false);
	let selectedLinks = $state<Set<string>>(new Set());

	// Get header and links modules - use functions to ensure reactivity
	function getHeaderModule() {
		return card.config.modules?.find(m => m.type === 'header');
	}
	
	function getLinksModule() {
		return card.config.modules?.find(m => m.type === 'links');
	}
	
	// For backward compatibility with existing code
	let headerModule = $derived(getHeaderModule());
	let linksModule = $derived(getLinksModule());

	// Load existing card if editing
	onMount(async () => {
		// Load user links first
		await loadUserLinks();
		
		// Load user avatar
		await loadUserAvatar();
		
		const cardId = $page.url.searchParams.get('id');
		if (cardId) {
			loading = true;
			try {
				const { unifiedCardService } = await import('$lib/services/unifiedCardService');
				const existingCard = await unifiedCardService.getCard(cardId);
				if (existingCard) {
					editingCard = existingCard;
					card = { ...existingCard };
					
					// Initialize selected links after loading the card
					const linksModuleInCard = existingCard.config.modules?.find(m => m.type === 'links');
					if (linksModuleInCard?.props.links && Array.isArray(linksModuleInCard.props.links)) {
						// Extract IDs from the saved links
						const savedLinkIds = linksModuleInCard.props.links
							.map((l: any) => l.id)
							.filter((id: any) => id); // Filter out any undefined/null IDs
						selectedLinks = new Set(savedLinkIds);
					}
				}
			} catch (error) {
				console.error('Error loading card:', error);
			} finally {
				loading = false;
			}
		}
	});

	// Load user's links
	async function loadUserLinks() {
		if (!browser) return;
		
		loadingLinks = true;
		try {
			const { pb } = await import('$lib/pocketbase');
			
			if (!pb.authStore.isValid) {
				goto('/login');
				return;
			}

			const links = await pb.collection('links').getFullList({
				filter: `user_id="${pb.authStore.model?.id}"`,
				sort: '-created'
			});

			userLinks = links.map(link => ({
				id: link.id,
				title: link.title,
				url: link.original_url,
				shortCode: link.short_code,
				icon: link.icon || '🔗'
			}));
		} catch (error) {
			console.error('Error loading links:', error);
		} finally {
			loadingLinks = false;
		}
	}

	// Load user avatar
	async function loadUserAvatar() {
		if (!browser) return;
		
		try {
			const { pb } = await import('$lib/pocketbase');
			
			if (!pb.authStore.isValid || !pb.authStore.model) {
				return;
			}

			const user = pb.authStore.model;
			
			// If user has an avatar, get the file URL
			if (user.avatar) {
				userAvatarUrl = pb.getFileUrl(user, user.avatar);
				
				// Set the avatar in the header module for new cards (not when editing)
				const moduleIndex = card.config.modules?.findIndex(m => m.type === 'header');
				if (moduleIndex !== undefined && moduleIndex >= 0 && card.config.modules) {
					// Only set if there's no avatar already
					if (!card.config.modules[moduleIndex].props.avatar && !editingCard) {
						card.config.modules[moduleIndex].props.avatar = userAvatarUrl;
						// Force reactivity
						card = {
							...card,
							config: {
								...card.config,
								modules: [...card.config.modules]
							}
						};
					}
				}
			}
			
			// Also set user name as default if not editing
			if (user.name && !editingCard) {
				const moduleIndex = card.config.modules?.findIndex(m => m.type === 'header');
				if (moduleIndex !== undefined && moduleIndex >= 0 && card.config.modules) {
					if (card.config.modules[moduleIndex].props.title === 'Dein Name') {
						card.config.modules[moduleIndex].props.title = user.name;
						// Force reactivity
						card = {
							...card,
							config: {
								...card.config,
								modules: [...card.config.modules]
							}
						};
					}
				}
			}
		} catch (error) {
			console.error('Error loading user avatar:', error);
		}
	}

	// Toggle link selection
	function toggleLinkSelection(linkId: string) {
		const newSelection = new Set(selectedLinks);
		if (newSelection.has(linkId)) {
			newSelection.delete(linkId);
		} else {
			newSelection.add(linkId);
		}
		selectedLinks = newSelection;
		updateSelectedLinks();
	}

	// Update selected links in card
	function updateSelectedLinks() {
		const selectedLinksList = userLinks.filter(link => selectedLinks.has(link.id));
		
		const formattedLinks = selectedLinksList.map(link => ({
			id: link.id,
			label: link.title,
			href: `${window.location.origin}/l/${link.shortCode}`,
			icon: link.icon
		}));

		// Find the links module and update it
		const moduleIndex = card.config.modules?.findIndex(m => m.type === 'links');
		
		if (moduleIndex !== undefined && moduleIndex >= 0 && card.config.modules) {
			// Create a deep copy of the modules array
			const newModules = card.config.modules.map((module, index) => {
				if (index === moduleIndex) {
					return {
						...module,
						props: {
							...module.props,
							links: formattedLinks
						}
					};
				}
				return module;
			});
			
			// Update the entire card to trigger reactivity
			card = {
				...card,
				config: {
					...card.config,
					modules: newModules
				}
			};
		}
	}

	// Start editing title
	function startEditingTitle() {
		if (headerModule) {
			tempTitle = headerModule.props.title || '';
			editingTitle = true;
		}
	}

	// Save title
	function saveTitle() {
		if (headerModule) {
			headerModule.props.title = tempTitle;
			card = { ...card };
		}
		editingTitle = false;
	}

	// Start editing subtitle
	function startEditingSubtitle() {
		if (headerModule) {
			tempSubtitle = headerModule.props.subtitle || '';
			editingSubtitle = true;
		}
	}

	// Save subtitle
	function saveSubtitle() {
		if (headerModule) {
			headerModule.props.subtitle = tempSubtitle;
			card = { ...card };
		}
		editingSubtitle = false;
	}

	// Handle avatar upload
	async function handleAvatarUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// For now, we'll use a data URL
		// In production, you'd upload to a server
		const reader = new FileReader();
		reader.onload = (e) => {
			if (headerModule && e.target?.result) {
				headerModule.props.avatar = e.target.result as string;
				card = { ...card };
			}
		};
		reader.readAsDataURL(file);
	}

	// Save card
	async function saveCard() {
		if (!browser) return;
		
		saving = true;
		try {
			const { unifiedCardService } = await import('$lib/services/unifiedCardService');
			const { pb } = await import('$lib/pocketbase');
			
			if (!pb.authStore.model) {
				goto('/login');
				return;
			}

			// Create a plain object to avoid sending Svelte proxy objects
			const cardData = {
				type: card.type,
				config: {
					mode: card.config.mode,
					modules: card.config.modules?.map(m => ({
						id: m.id,
						type: m.type,
						order: m.order,
						props: m.type === 'links' && m.props.links 
							? {
								...m.props,
								links: m.props.links.map((link: any) => ({
									id: link.id,
									label: link.label,
									href: link.href,
									icon: link.icon,
									description: link.description,
									disabled: link.disabled
								}))
							}
							: { ...m.props },
						visibility: m.visibility,
						className: m.className,
						grid: m.grid
					})),
					theme: card.config.theme ? { ...card.config.theme } : undefined,
					layout: card.config.layout ? { ...card.config.layout } : undefined,
					animations: card.config.animations ? { ...card.config.animations } : undefined
				},
				metadata: {
					name: card.metadata.name,
					description: card.metadata.description
				},
				constraints: card.constraints ? { ...card.constraints } : {},
				visibility: card.visibility,
				category: card.category,
				variant: card.variant,
				user_id: pb.authStore.model.id,
				page: 'profile',
				usage_count: card.usage_count || 0,
				likes_count: card.likes_count || 0
			};

			console.log('Saving card data:', JSON.stringify(cardData, null, 2));

			let savedCard;
			if (editingCard?.id) {
				savedCard = await unifiedCardService.updateCard(editingCard.id, cardData);
			} else {
				savedCard = await unifiedCardService.createCard(cardData);
			}

			if (savedCard) {
				// Use window.location for a full page refresh to avoid state issues
				window.location.href = '/my/cards';
			}
		} catch (error) {
			console.error('Error saving card:', error);
			alert('Fehler beim Speichern der Card');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Card Builder - uload</title>
</svelte:head>

<div class="min-h-screen bg-theme-background">
	{#if loading}
		<div class="flex h-screen items-center justify-center">
			<div class="text-center">
				<div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-theme-border border-t-theme-primary"></div>
				<p class="text-theme-text-muted">Lade Card...</p>
			</div>
		</div>
	{:else}
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<h1 class="text-3xl font-bold text-theme-text">
					{editingCard ? 'Card bearbeiten' : 'Neue Card'}
				</h1>
				<div class="flex items-center gap-2">
					<button
						onclick={() => goto('/my/cards')}
						class="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 font-medium text-theme-text transition-all hover:bg-theme-surface-hover"
					>
						Abbrechen
					</button>
					<button
						onclick={saveCard}
						disabled={saving}
						class="rounded-lg bg-theme-primary px-4 py-2 font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-theme-primary-hover disabled:opacity-50"
					>
						{saving ? 'Speichern...' : editingCard ? 'Änderungen speichern' : 'Card erstellen'}
					</button>
				</div>
			</div>

			<!-- Main Content - Card in Center -->
			<div class="flex justify-center">
				<div class="w-full max-w-lg">
					<!-- Card Preview with Inline Editing -->
					<div class="rounded-xl border border-theme-border bg-theme-surface p-8 shadow-lg">
					<!-- Header Module -->
					{#if headerModule}
						<div class="mb-6 text-center">
							<!-- Avatar -->
							<div class="relative mx-auto mb-4 h-24 w-24">
								{#if headerModule.props.avatar || userAvatarUrl}
									<img
										src={headerModule.props.avatar || userAvatarUrl}
										alt="Avatar"
										class="h-full w-full rounded-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
										<span class="text-3xl font-bold text-white">
											{(headerModule.props.title || 'U')[0].toUpperCase()}
										</span>
									</div>
								{/if}
								<label class="absolute bottom-0 right-0 cursor-pointer rounded-full bg-theme-primary p-2 text-white shadow-lg transition-all hover:scale-110 hover:bg-theme-primary-hover" title="Anderes Bild wählen">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
									</svg>
									<input type="file" accept="image/*" class="hidden" onchange={handleAvatarUpload} />
								</label>
							</div>

							<!-- Title -->
							{#if editingTitle}
								<input
									type="text"
									bind:value={tempTitle}
									onblur={saveTitle}
									onkeydown={(e) => e.key === 'Enter' && saveTitle()}
									class="mb-2 w-full rounded-lg border-2 border-theme-primary px-3 py-1 text-center text-2xl font-bold text-theme-text bg-theme-background focus:outline-none focus:ring-2 focus:ring-theme-accent"
									autofocus
								/>
							{:else}
								<h2
									onclick={startEditingTitle}
									class="mb-2 cursor-pointer text-2xl font-bold text-theme-text hover:text-theme-primary transition-colors"
								>
									{headerModule.props.title || 'Klicke zum Bearbeiten'}
								</h2>
							{/if}

							<!-- Subtitle -->
							{#if editingSubtitle}
								<input
									type="text"
									bind:value={tempSubtitle}
									onblur={saveSubtitle}
									onkeydown={(e) => e.key === 'Enter' && saveSubtitle()}
									class="w-full rounded-lg border-2 border-theme-primary px-3 py-1 text-center text-theme-text-muted bg-theme-background focus:outline-none focus:ring-2 focus:ring-theme-accent"
									autofocus
								/>
							{:else}
								<p
									onclick={startEditingSubtitle}
									class="cursor-pointer text-theme-text-muted hover:text-theme-primary transition-colors"
								>
									{headerModule.props.subtitle || 'Position hinzufügen'}
								</p>
							{/if}
						</div>
					{/if}

					<!-- Links Module - Always visible -->
					{#key card.config.modules}
					{@const currentLinksModule = card.config.modules?.find(m => m.type === 'links')}
					<div class="mt-6 border-t border-theme-border pt-6">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-semibold text-theme-text">Deine Links</h3>
							<button
								onclick={() => showLinkSelector = !showLinkSelector}
								class="rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-theme-primary-hover"
							>
								{showLinkSelector ? '✓ Fertig' : '+ Links hinzufügen'}
							</button>
						</div>

						{#if showLinkSelector}
							<!-- Link Selector -->
							<div class="rounded-lg border border-theme-border bg-theme-background p-4">
								{#if loadingLinks}
									<p class="text-center text-sm text-theme-text-muted">
										<span class="inline-block animate-spin">⚡</span> Lade deine Links...
									</p>
								{:else if userLinks.length === 0}
									<div class="text-center">
										<p class="mb-2 text-theme-text-muted">
											Du hast noch keine Links erstellt.
										</p>
										<a href="/my/links" class="inline-flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-theme-primary-hover">
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
											</svg>
											Ersten Link erstellen
										</a>
									</div>
								{:else}
									<div class="space-y-2">
										<p class="mb-3 text-sm text-theme-text-muted">
											Wähle die Links aus, die auf deiner Card erscheinen sollen:
										</p>
										{#each userLinks as link}
											<label class="flex cursor-pointer items-center gap-3 rounded-lg border border-theme-border bg-theme-surface p-3 transition-all hover:bg-theme-surface-hover">
												<input
													type="checkbox"
													checked={selectedLinks.has(link.id)}
													onchange={() => toggleLinkSelection(link.id)}
													class="h-5 w-5 rounded border-2 text-theme-primary focus:ring-2 focus:ring-theme-accent"
												/>
												<span class="text-xl">{link.icon}</span>
												<div class="flex-1">
													<p class="font-medium text-theme-text">{link.title}</p>
													<p class="text-xs text-theme-text-muted">ulo.ad/l/{link.shortCode}</p>
												</div>
											</label>
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<!-- Display Selected Links -->
							{#if currentLinksModule?.props?.links && currentLinksModule.props.links.length > 0}
								<div class="space-y-2">
									{#each currentLinksModule.props.links as link}
										<a
											href={link.href}
											target="_blank"
											rel="noopener noreferrer"
											class="flex items-center gap-3 rounded-lg border border-theme-border bg-theme-background px-4 py-3 text-theme-text transition-all hover:bg-theme-surface-hover hover:scale-[1.02]"
										>
											<span class="text-xl">{link.icon}</span>
											<span class="flex-1 font-medium">{link.label}</span>
											<svg class="h-5 w-5 text-theme-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
											</svg>
										</a>
									{/each}
								</div>
							{:else}
								<div class="rounded-lg border-2 border-dashed border-theme-border bg-theme-background p-6 text-center">
									<svg class="mx-auto mb-3 h-12 w-12 text-theme-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
									</svg>
									<p class="mb-2 text-theme-text">
										Noch keine Links hinzugefügt
									</p>
									<p class="text-sm text-theme-text-muted">
										Klicke auf "Links hinzufügen" um deine uload Links auszuwählen
									</p>
								</div>
							{/if}
						{/if}
					</div>
					{/key}
				</div>

					<!-- Card Settings -->
					<div class="mt-6 rounded-lg border border-theme-border bg-theme-surface p-4">
						<div class="flex items-center gap-4">
							<label class="flex-1">
								<span class="mb-1 block text-xs font-medium text-theme-text-muted">Card Name</span>
								<input
									type="text"
									bind:value={card.metadata.name}
									class="w-full rounded-lg border border-theme-border bg-theme-background px-3 py-2 text-sm text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
								/>
							</label>
							<label class="flex-1">
								<span class="mb-1 block text-xs font-medium text-theme-text-muted">Sichtbarkeit</span>
								<select
									bind:value={card.visibility}
									class="w-full rounded-lg border border-theme-border bg-theme-background px-3 py-2 text-sm text-theme-text focus:ring-2 focus:ring-theme-accent focus:outline-none"
								>
									<option value="public">🌍 Öffentlich</option>
									<option value="unlisted">🔗 Nicht gelistet</option>
									<option value="private">🔒 Privat</option>
								</select>
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>