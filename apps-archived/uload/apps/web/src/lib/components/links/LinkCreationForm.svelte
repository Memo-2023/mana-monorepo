<script lang="ts">
	import { enhance } from '$app/forms';
	import TagSelector from '$lib/components/TagSelector.svelte';
	import type { Tag } from '$lib/pocketbase';
	import { toastMessages, notify } from '$lib/services/toast';
	import { trackLinkCreated } from '$lib/analytics';
	import { activeWorkspace } from '$lib/stores/activeWorkspace';
	import * as m from '$paraglide/messages';

	interface Props {
		user?: {
			id: string;
			username?: string;
		};
		folders?: Array<{
			id: string;
			icon: string;
			display_name: string;
		}>;
		tags?: Tag[];
		workspace?: any;
		editingLink?: any;
		action?: string;
		mode?: 'simple' | 'advanced';
		onSuccess?: (link: any, shortUrl: string) => void;
		onCancel?: () => void;
	}

	let {
		user,
		folders = [],
		tags = [],
		workspace,
		editingLink,
		action = '?/create',
		mode = 'advanced',
		onSuccess,
		onCancel,
	}: Props = $props();

	// Get active workspace data
	let activeWorkspaceData = $state(activeWorkspace.getData());

	// Subscribe to activeWorkspace changes
	$effect(() => {
		const unsubData = activeWorkspace.data.subscribe((data) => {
			activeWorkspaceData = data;
		});

		return () => {
			unsubData();
		};
	});

	// Dynamic action based on editing state and workspace
	let dynamicAction = $derived(
		editingLink
			? '?/update' + (workspace?.id ? `&workspace=${workspace.id}` : '')
			: action + (workspace?.id ? `&workspace=${workspace.id}` : '')
	);

	let isSubmitting = $state(false);
	let linkPreview = $state('');
	let selectedTags = $state<Tag[]>([]);
	let showAdvancedOptions = $state(false);
	let showSocialMediaOptions = $state(false);
	let urlPreview = $state('');
	let isValidUrl = $state(false);
	let error = $state<string | null>(null);
	let customCode = $state('');
	let useUsername = $state(false);
	let copiedToClipboard = $state(false);
	let createdLink = $state<{ url: string; shortCode: string } | null>(null);
	let showSuccess = $state(false);

	// Progressive form states
	let currentStep = $state(1);
	let completedSteps = $state<Set<number>>(new Set());
	let formData = $state({
		url: '',
		title: '',
		customCode: '',
		useUsername: false,
	});
	let showShortlinkPreview = $state(false);
	let generatedCode = $state('');

	// Generate a random short code (same logic as server)
	function generateShortCode(length: number = 6): string {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	function updateLinkPreview() {
		if (!window) return;

		// Use custom code if provided, otherwise use generated code
		const code = formData.customCode || customCode || generatedCode || '[code]';

		console.log('📋 updateLinkPreview - codes:', {
			customCode,
			generatedCode,
			formDataCustomCode: formData.customCode,
			finalCode: code,
			workspace: workspace,
		});

		// Check if user wants prefix
		if (formData.useUsername || useUsername) {
			// User wants prefix - check workspace context first
			if (activeWorkspaceData?.slug) {
				// Workspace URL format
				linkPreview = `${window.location.origin}/w/${activeWorkspaceData.slug}/${code}`;
			} else if (user?.username) {
				// Personal workspace with username
				linkPreview = `${window.location.origin}/u/${user.username}/${code}`;
			} else {
				// No prefix available, just simple format
				linkPreview = `${window.location.origin}/${code}`;
			}
		} else {
			// User doesn't want prefix - simple format
			linkPreview = `${window.location.origin}/${code}`;
		}
	}

	$effect(() => {
		updateLinkPreview();
	});

	// Populate form when editing a link
	$effect(() => {
		if (editingLink) {
			formData = {
				url: editingLink.original_url || '',
				title: editingLink.title || '',
				customCode: editingLink.short_code || '',
				useUsername: editingLink.use_username || false,
			};

			// Set other form fields
			customCode = editingLink.short_code || '';
			useUsername = editingLink.use_username || false;

			// Set selected tags if available
			if (editingLink.expand?.['link_tags(link_id)']) {
				selectedTags = editingLink.expand['link_tags(link_id)']
					.map((linkTag: any) => linkTag.expand?.tag_id)
					.filter(Boolean);
			}

			console.log('🔄 Editing link:', editingLink);
			console.log('📝 Form data set to:', formData);
		} else if (!editingLink && !generatedCode && isValidUrl) {
			// Generate code for new links when URL becomes valid
			generatedCode = generateShortCode();
			console.log('🎲 Generated initial code for new link:', generatedCode);
		}
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		copiedToClipboard = true;
		setTimeout(() => (copiedToClipboard = false), 2000);
	}

	function validateAndPreviewUrl(event: Event) {
		const input = event.target as HTMLInputElement;
		const url = input.value?.trim();
		console.log('🔍 LinkCreationForm: Validating URL:', url);

		// Update formData
		formData.url = url;

		if (!url) {
			urlPreview = '';
			isValidUrl = false;
			showShortlinkPreview = false;
			generatedCode = '';
			return;
		}

		try {
			// Add protocol if missing
			let testUrl = url;
			if (!url.match(/^https?:\/\//)) {
				testUrl = 'https://' + url;
			}
			new URL(testUrl);
			urlPreview = url;
			isValidUrl = true;
			showShortlinkPreview = true;

			// Generate a random code for preview when URL becomes valid
			if (!generatedCode) {
				generatedCode = generateShortCode();
			}

			// Auto-advance after valid URL
			if (isValidUrl && !completedSteps.has(1)) {
				completedSteps.add(1);
				// Show shortlink immediately, don't auto-advance
				currentStep = 2;
			}
		} catch {
			urlPreview = url;
			isValidUrl = false;
			showShortlinkPreview = false;
			generatedCode = '';
			formData.url = url; // Make sure it's set even if invalid
		}
	}

	function nextStep() {
		// New step order:
		// 1. URL
		// 2. Shortlink preview + username option
		// 3. Title
		// 4. Tags/Folders (if available)
		let maxSteps = 3; // URL + Shortlink + Title
		if (user && (tags?.length > 0 || folders?.length > 0)) maxSteps = 4; // + Tags/Folders

		if (currentStep < maxSteps) {
			currentStep++;
			// Focus next input after animation
			setTimeout(() => {
				const nextInput = document.querySelector(
					`[data-step="${currentStep}"]`
				) as HTMLInputElement;
				if (nextInput) nextInput.focus();
			}, 150);
		}
	}

	function handleKeydown(event: KeyboardEvent, step: number) {
		if (event.key === 'Enter' || event.key === 'Tab') {
			if (step < currentStep) return; // Already completed

			if (event.key === 'Enter') {
				event.preventDefault();
			}

			// Validate current step before advancing
			if (step === 1 && !isValidUrl) return;

			if (!completedSteps.has(step)) {
				completedSteps.add(step);
			}

			if (event.key === 'Tab' && !event.shiftKey) {
				event.preventDefault();
				nextStep();
			} else if (event.key === 'Enter') {
				nextStep();
			}
		}
	}

	function handleSubmit() {
		console.log('🚀 LinkCreationForm: handleSubmit called');
		console.log('Generated code being sent:', generatedCode);

		isSubmitting = true;
		error = null;

		return async ({ result, update, formData }: any) => {
			console.log('📦 LinkCreationForm: Form enhance callback triggered');
			console.log('Result type:', result.type);
			console.log('Result data:', result.data);
			if (result.type === 'success') {
				console.log('✅ LinkCreationForm: Success! Link created');
				console.log('Link data:', result.data?.link);
				console.log('Short URL:', result.data?.shortUrl);
				toastMessages.linkCreated();
				selectedTags = [];

				if (result.data?.link) {
					const shortUrl =
						result.data.shortUrl ||
						(useUsername && user?.username
							? `${window.location.origin}/u/${user.username}/${result.data.link.short_code}`
							: `${window.location.origin}/${result.data.link.short_code}`);

					createdLink = {
						url: shortUrl,
						shortCode: result.data.link.short_code,
					};

					// Show success animation
					showSuccess = true;
					setTimeout(() => (showSuccess = false), 2000);

					trackLinkCreated({
						shortCode: result.data.link.short_code,
						hasPassword: !!result.data.link.password,
						hasExpiry: !!result.data.link.expires_at,
						hasClickLimit: !!result.data.link.max_clicks,
					});

					if (onSuccess) {
						onSuccess(result.data.link, shortUrl);
					}

					// Reset form after successful creation
					setTimeout(() => {
						formData = { url: '', title: '', customCode: '', useUsername: false };
						customCode = '';
						useUsername = false;
						urlPreview = '';
						isValidUrl = false;
						currentStep = 1;
						completedSteps.clear();
						createdLink = null;
						generatedCode = '';
					}, 3000);
				}
			} else if (result.type === 'failure' && result.data?.error) {
				console.error('❌ LinkCreationForm: Failed to create link');
				console.error('Error:', result.data.error);
				error = result.data.error;

				// Special handling for limit exceeded errors
				if (result.data?.limit_exceeded) {
					const limitMsg = `Monatslimit erreicht! Du hast ${result.data.current_count}/${result.data.limit} Links verwendet.`;
					notify.error('Link-Limit erreicht', limitMsg + ' Upgrade für mehr Links!');
				} else {
					notify.error(m.error_link_creation_single(), result.data.error);
				}
			} else {
				console.warn('⚠️ LinkCreationForm: Unexpected result type');
				console.warn('Full result:', result);
			}
			await update();
			isSubmitting = false;
			console.log('🏁 LinkCreationForm: handleSubmit complete');
		};
	}
</script>

<form
	method="POST"
	action={dynamicAction}
	use:enhance={handleSubmit}
	class="mx-auto max-w-2xl"
	onsubmit={() => console.log('📤 Form onsubmit event fired!')}
>
	{#if editingLink}
		<input type="hidden" name="id" value={editingLink.id} />
	{/if}
	<!-- Send generated code to server -->
	<input type="hidden" name="generated_code" bind:value={generatedCode} />
	{#if generatedCode}
		<input type="hidden" name="debug_generated_code" value={generatedCode} />
	{/if}
	<div class="space-y-6">
		<!-- Step 1: URL Input - Compact Layout -->
		<div
			class="transition-all duration-300 ease-out {currentStep >= 1
				? 'translate-y-0 opacity-100'
				: 'translate-y-4 opacity-0'}"
		>
			<div class="flex items-center gap-3">
				<label for="url" class="whitespace-nowrap text-lg font-medium text-theme-text">
					URL kürzen:
				</label>
				<div class="relative flex-1">
					<div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
						<svg
							class="h-5 w-5 text-theme-text-muted"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							></path>
						</svg>
					</div>
					<input
						type="url"
						id="url"
						name="url"
						data-step="1"
						required
						placeholder="https://beispiel.de"
						value={formData.url}
						oninput={validateAndPreviewUrl}
						onkeydown={(e) => handleKeydown(e, 1)}
						class="w-full rounded-lg border-2 pl-10 pr-10 {isValidUrl
							? 'border-green-500 bg-green-50/50 focus:border-green-500 focus:ring-green-500 dark:bg-green-900/20'
							: error && formData.url
								? 'border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-500 dark:bg-red-900/20'
								: 'border-theme-border bg-theme-surface focus:border-theme-accent focus:ring-2 focus:ring-theme-accent'} px-4 py-2 text-theme-text placeholder-theme-text-muted shadow-sm transition-all hover:shadow-md focus:outline-none"
					/>
					{#if isValidUrl}
						<div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
							<svg
								class="h-5 w-5 text-green-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
					{/if}
				</div>
			</div>
			{#if urlPreview && !isValidUrl}
				<div class="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					Bitte geben Sie eine gültige URL ein (z.B. https://beispiel.de)
				</div>
			{/if}
		</div>

		<!-- Step 2: Shortlink Preview + Options (appears immediately after valid URL) -->
		{#if showShortlinkPreview && isValidUrl}
			<div class="translate-y-0 space-y-4 opacity-100 transition-all duration-300 ease-out">
				<!-- Shortlink Preview -->
				<div
					class="rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20"
				>
					<div class="flex items-center gap-3">
						<div class="flex-none">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
							>
								<svg
									class="h-5 w-5 text-blue-600 dark:text-blue-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									></path>
								</svg>
							</div>
						</div>
						<div class="min-w-0 flex-1">
							<p class="mb-1 text-xs font-semibold text-blue-900 dark:text-blue-300">
								✨ Ihre kurze URL wird sein:
							</p>
							<div class="flex items-center gap-2">
								<code class="flex-1 truncate font-mono text-base text-blue-700 dark:text-blue-400">
									{linkPreview || `${window.location.origin}/[code]`}
								</code>
								<button
									type="button"
									onclick={() => copyToClipboard(linkPreview)}
									class="flex-none rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 {copiedToClipboard
										? 'scale-105 bg-green-500 text-white'
										: 'bg-blue-600 text-white hover:scale-105 hover:bg-blue-700'}"
								>
									{copiedToClipboard ? '✓' : '📋'}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Workspace Indicator (when in workspace context) -->
				{#if workspace?.slug}
					<div
						class="flex items-center gap-2 rounded-lg border-2 border-purple-500 bg-purple-50 px-3 py-2 dark:bg-purple-900/30"
					>
						<svg
							class="h-5 w-5 text-purple-600 dark:text-purple-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							></path>
						</svg>
						<span class="text-sm font-medium text-theme-text">
							Workspace-Link: <span class="font-mono text-purple-600 dark:text-purple-400"
								>/w/{workspace.slug}/</span
							>
						</span>
					</div>

					<!-- Custom Code Field for workspace -->
					{#if mode === 'advanced'}
						<input
							type="text"
							id="custom_code"
							name="custom_code"
							value={customCode}
							oninput={(e) => {
								customCode = e.currentTarget.value;
								formData.customCode = e.currentTarget.value;
							}}
							placeholder="Eigener Code (optional)"
							pattern="[a-zA-Z0-9_\-]+"
							title="Nur Buchstaben, Zahlen, Bindestriche und Unterstriche erlaubt"
							class="hover:border-theme-border-hover flex-1 rounded-lg border-2 border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text placeholder-theme-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					{/if}
				{/if}

				<!-- Username Option as Compact Button (only show if not in workspace context) -->
				{#if user && !workspace?.slug}
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={() => {
								useUsername = !useUsername;
								formData.useUsername = !useUsername;
								// Clear custom code when disabling username
								if (!useUsername && mode === 'advanced') {
									customCode = '';
									formData.customCode = '';
								}
								// Regenerate code when switching username mode for better UX
								if (useUsername && !customCode) {
									// Keep the same generated code
								} else if (!useUsername) {
									// Generate new code for non-username mode
									generatedCode = generateShortCode();
								}
							}}
							class="flex items-center gap-2 rounded-lg border-2 transition-all duration-200 {useUsername
								? 'border-blue-500 bg-blue-50 shadow-md dark:bg-blue-900/30'
								: 'border-theme-border bg-theme-surface hover:border-blue-300 hover:bg-theme-surface-hover hover:shadow-sm'} cursor-pointer px-3 py-2"
						>
							<!-- Checkbox indicator -->
							<div
								class="flex h-5 w-5 items-center justify-center rounded border-2 transition-all {useUsername
									? 'border-blue-500 bg-blue-500'
									: 'border-gray-400 bg-white dark:bg-gray-800'}"
							>
								{#if useUsername}
									<svg
										class="h-3 w-3 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M5 13l4 4L19 7"
										></path>
									</svg>
								{/if}
							</div>
							<span class="text-sm font-medium text-theme-text">
								{#if activeWorkspaceData?.slug}
									Workspace in URL verwenden <span
										class="font-mono text-blue-600 dark:text-blue-400"
										>/w/{activeWorkspaceData.slug}/</span
									>
								{:else if user?.username}
									Benutzername in URL verwenden <span
										class="font-mono text-blue-600 dark:text-blue-400">/u/{user.username}/</span
									>
								{:else}
									Prefix in URL verwenden
								{/if}
							</span>
							<!-- Hidden checkbox for form submission -->
							<input
								type="checkbox"
								id="use_username"
								name="use_username"
								checked={useUsername}
								class="sr-only"
							/>
						</button>

						<!-- Custom Code Field - Only show when username is selected -->
						{#if mode === 'advanced' && useUsername}
							<input
								type="text"
								id="custom_code"
								name="custom_code"
								value={customCode}
								oninput={(e) => {
									customCode = e.currentTarget.value;
									formData.customCode = e.currentTarget.value;
								}}
								placeholder="mein-link"
								pattern="[a-zA-Z0-9_\-]+"
								title="Nur Buchstaben, Zahlen, Bindestriche und Unterstriche erlaubt"
								class="hover:border-theme-border-hover flex-1 rounded-lg border-2 border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text placeholder-theme-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-theme-accent"
							/>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Step 3: Title (appears after shortlink preview) -->
		{#if currentStep >= 3}
			<div
				class="transition-all duration-300 ease-out {currentStep >= 3
					? 'translate-y-0 opacity-100'
					: 'translate-y-4 opacity-0'}"
			>
				<label for="title" class="mb-2 block text-lg font-medium text-theme-text">
					<span class="mr-2 text-theme-accent">2.</span>
					Geben Sie Ihrem Link einen Titel
				</label>
				<input
					type="text"
					id="title"
					name="title"
					data-step="3"
					placeholder="z.B. Meine Webseite, GitHub Projekt, Portfolio..."
					value={formData.title}
					oninput={(e) => (formData.title = e.currentTarget.value)}
					onkeydown={(e) => handleKeydown(e, 3)}
					class="w-full rounded-lg border-2 border-theme-border bg-theme-surface px-4 py-3 text-theme-text placeholder-theme-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-theme-accent"
				/>
			</div>
		{/if}

		<!-- Step 4: Tags and Folders (appears last) -->
		{#if currentStep >= 4 && user}
			<div
				class="transition-all duration-300 ease-out {currentStep >= 4
					? 'translate-y-0 opacity-100'
					: 'translate-y-4 opacity-0'}"
			>
				<label class="mb-3 block text-lg font-medium text-theme-text">
					<span class="mr-2 text-theme-accent">3.</span>
					Organisation (optional)
				</label>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#if mode === 'advanced' && folders.length > 0}
						<div>
							<label for="folder" class="mb-1 block text-sm font-medium text-theme-text">
								Ordner
							</label>
							<select
								id="folder"
								name="folder"
								class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
							>
								<option value="">Kein Ordner</option>
								{#each folders as folder}
									<option value={folder.id}>
										{folder.icon}
										{folder.display_name}
									</option>
								{/each}
							</select>
						</div>
					{/if}
					<div class={mode === 'simple' || !folders.length ? 'sm:col-span-2' : ''}>
						<label for="link-tag-selector" class="mb-1 block text-sm font-medium text-theme-text">
							Tags
						</label>
						<TagSelector
							id="link-tag-selector"
							userId={user.id}
							bind:selectedTags
							placeholder="Tags hinzufügen..."
						/>
						{#each selectedTags as tag}
							<input type="hidden" name="tags" value={tag.id} />
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Advanced Options Toggle (only show after basic info is filled) -->
		{#if currentStep >= 3 && mode === 'advanced'}
			<div class="border-t border-theme-border pt-4">
				<button
					type="button"
					onclick={() => (showAdvancedOptions = !showAdvancedOptions)}
					class="flex items-center gap-2 text-sm font-medium text-theme-text transition-colors hover:text-theme-accent"
				>
					<svg
						class="h-4 w-4 transition-transform {showAdvancedOptions ? 'rotate-90' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
					Erweiterte Optionen
				</button>
			</div>
		{/if}

		{#if showAdvancedOptions && currentStep >= 3}
			<div class="space-y-4 rounded-lg bg-theme-surface-hover p-4">
				<div>
					<label for="description" class="mb-1 block text-sm font-medium text-theme-text">
						Beschreibung (optional)
					</label>
					<textarea
						id="description"
						name="description"
						rows="2"
						placeholder="Kurze Beschreibung des Links"
						class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
					></textarea>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div>
						<label for="expires_in" class="mb-1 block text-sm font-medium text-theme-text">
							Läuft ab in (Tagen)
						</label>
						<input
							type="number"
							id="expires_in"
							name="expires_in"
							min="1"
							placeholder="Nie"
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>
					<div>
						<label for="max_clicks" class="mb-1 block text-sm font-medium text-theme-text">
							Max. Klicks
						</label>
						<input
							type="number"
							id="max_clicks"
							name="max_clicks"
							min="1"
							placeholder="Unbegrenzt"
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>
					<div>
						<label for="password" class="mb-1 block text-sm font-medium text-theme-text">
							Passwortschutz
						</label>
						<input
							type="password"
							id="password"
							name="password"
							placeholder="Optional"
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>
				</div>

				{#if mode === 'advanced'}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="activate_at" class="mb-1 block text-sm font-medium text-theme-text">
								Aktivieren um (optional)
							</label>
							<input
								type="datetime-local"
								id="activate_at"
								name="activate_at"
								class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
							/>
							<p class="mt-1 text-xs text-theme-text-muted">
								Link ist inaktiv bis zu diesem Zeitpunkt
							</p>
						</div>
						<div>
							<label for="expires_at" class="mb-1 block text-sm font-medium text-theme-text">
								Läuft ab um (optional)
							</label>
							<input
								type="datetime-local"
								id="expires_at"
								name="expires_at"
								class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
							/>
							<p class="mt-1 text-xs text-theme-text-muted">
								Überschreibt "Läuft ab in Tagen" wenn gesetzt
							</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if mode === 'advanced'}
			<!-- Social Media Preview Toggle -->
			<div class="border-t border-theme-border pt-4">
				<button
					type="button"
					onclick={() => (showSocialMediaOptions = !showSocialMediaOptions)}
					class="flex items-center gap-2 text-sm text-theme-accent hover:text-theme-accent-hover"
				>
					<svg
						class="h-4 w-4 transition-transform {showSocialMediaOptions ? 'rotate-90' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
						></path>
					</svg>
					Social-Media-Vorschau (optional)
				</button>
			</div>

			{#if showSocialMediaOptions}
				<div class="space-y-4 rounded-lg bg-theme-surface-hover p-4">
					<p class="text-sm text-theme-text-muted">
						Passen Sie an, wie Ihr Link erscheint, wenn er auf Social-Media-Plattformen geteilt wird
					</p>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="og_title" class="mb-1 block text-sm font-medium text-theme-text">
								Vorschau-Titel
							</label>
							<input
								type="text"
								id="og_title"
								name="og_title"
								placeholder="Interessanter Artikel"
								class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
							/>
						</div>
						<div>
							<label for="og_image" class="mb-1 block text-sm font-medium text-theme-text">
								Vorschau-Bild-URL
							</label>
							<input
								type="url"
								id="og_image"
								name="og_image"
								placeholder="https://example.com/bild.jpg"
								class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
							/>
						</div>
					</div>

					<div>
						<label for="og_description" class="mb-1 block text-sm font-medium text-theme-text">
							Vorschau-Beschreibung
						</label>
						<textarea
							id="og_description"
							name="og_description"
							rows="3"
							placeholder="Diese Beschreibung erscheint in der Social-Media-Vorschau, wenn Ihr Link geteilt wird..."
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						></textarea>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Submit Button (shows after URL is valid) -->
		{#if isValidUrl}
			<div class="flex translate-y-0 gap-2 opacity-100 transition-all duration-300 ease-out">
				<button
					type="submit"
					disabled={isSubmitting || !isValidUrl || showSuccess}
					onclick={() => console.log('💯 Submit button clicked! Submitting form...')}
					class="flex flex-1 transform items-center justify-center rounded-lg px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 {showSuccess
						? 'scale-105 bg-green-500'
						: isSubmitting
							? 'bg-gradient-to-r from-blue-500 to-indigo-500'
							: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'} disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if showSuccess}
						<svg
							class="mr-2 h-5 w-5 animate-bounce"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						Erfolgreich erstellt!
					{:else if isSubmitting}
						<svg class="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
						{editingLink ? 'Wird aktualisiert...' : 'Wird erstellt...'}
					{:else}
						{editingLink ? '✏️ Link aktualisieren' : '🚀 Link erstellen'}
					{/if}
				</button>
				{#if onCancel}
					<button
						type="button"
						onclick={onCancel}
						class="rounded-lg border border-theme-border bg-theme-surface px-4 py-4 font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
					>
						Abbrechen
					</button>
				{/if}
			</div>
		{/if}
	</div>
</form>

{#if error}
	<div
		class="mt-4 rounded-lg border-2 border-red-400 bg-red-50 p-3 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
	>
		<div class="flex items-center gap-2">
			<svg class="h-5 w-5 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<span>{error}</span>
		</div>
	</div>
{/if}

{#if createdLink && !error}
	<div
		class="mt-4 rounded-lg border border-green-400 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
	>
		<div class="flex items-start gap-3">
			<svg
				class="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<div class="flex-1">
				<p class="font-medium text-green-800 dark:text-green-300">Link erfolgreich erstellt!</p>
				<div class="mt-2 flex items-center gap-2">
					<code class="font-mono text-sm text-green-700 dark:text-green-400">
						{createdLink.url}
					</code>
					<button
						type="button"
						onclick={() => copyToClipboard(createdLink.url)}
						class="rounded px-2 py-1 text-xs font-medium transition-colors {copiedToClipboard
							? 'bg-green-600 text-white'
							: 'bg-green-700 text-white hover:bg-green-800'}"
					>
						{copiedToClipboard ? '✓ Kopiert' : 'Kopieren'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
