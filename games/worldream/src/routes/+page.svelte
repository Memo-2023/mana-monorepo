<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import { currentWorld } from '$lib/stores/worldContext';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let worlds = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadWorlds() {
		if (!data.user) {
			loading = false;
			return;
		}

		try {
			const response = await fetch('/api/nodes?kind=world');
			if (!response.ok) throw new Error('Failed to load worlds');
			worlds = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	function enterWorld(world: ContentNode) {
		currentWorld.setWorld(world);
		goto(`/worlds/${world.slug}`);
	}

	$effect(() => {
		loadWorlds();
	});
</script>

<div class="flex min-h-[80vh] flex-col">
	<!-- Hero Section -->
	<div
		class="bg-gradient-to-br from-theme-primary-700 via-theme-primary-600 to-theme-primary-800 text-theme-inverse"
	>
		<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="mb-4 text-5xl font-bold">Willkommen bei Worldream</h1>
				<p class="mx-auto max-w-2xl text-xl text-theme-primary-100">
					Erschaffe und erkunde fantastische Welten. Wähle eine Welt aus oder erstelle eine neue, um
					deine Geschichten zum Leben zu erwecken.
				</p>
			</div>
		</div>
	</div>

	{#if !data.user}
		<!-- Not logged in -->
		<div class="flex flex-1 items-center justify-center bg-theme-base">
			<div class="text-center">
				<svg
					class="mx-auto h-24 w-24 text-theme-text-tertiary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1"
						d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h2 class="mt-6 text-2xl font-semibold text-theme-text-primary">
					Bereit, deine eigenen Welten zu erschaffen?
				</h2>
				<p class="mt-2 text-theme-text-secondary">
					Melde dich an, um deine kreativen Ideen zum Leben zu erwecken.
				</p>
				<div class="mt-6 space-x-4">
					<a
						href="/auth/login"
						class="inline-flex items-center rounded-md border border-transparent bg-theme-primary-600 px-6 py-3 text-base font-medium text-theme-inverse hover:bg-theme-primary-700"
					>
						Anmelden
					</a>
					<a
						href="/auth/login"
						class="border-theme-border-default inline-flex items-center rounded-md border bg-theme-surface px-6 py-3 text-base font-medium text-theme-text-primary hover:bg-theme-interactive-hover"
					>
						Registrieren
					</a>
				</div>
			</div>
		</div>
	{:else if loading}
		<!-- Loading -->
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-theme-primary-600"
				></div>
				<p class="mt-4 text-theme-text-secondary">Lade deine Welten...</p>
			</div>
		</div>
	{:else if error}
		<!-- Error -->
		<div class="flex flex-1 items-center justify-center">
			<div class="rounded-md bg-red-50/50 p-6">
				<p class="text-sm text-theme-error">{error}</p>
			</div>
		</div>
	{:else}
		<!-- Worlds Grid -->
		<div class="flex-1 bg-theme-base py-12">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="mb-8 flex items-center justify-between">
					<h2 class="text-2xl font-bold text-theme-text-primary">
						{worlds.length > 0 ? 'Wähle eine Welt' : 'Erstelle deine erste Welt'}
					</h2>
					<a
						href="/worlds/new"
						class="inline-flex items-center rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-theme-inverse shadow-sm hover:bg-theme-primary-700"
					>
						<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Neue Welt
					</a>
				</div>

				{#if worlds.length === 0}
					<div class="py-12 text-center">
						<svg
							class="mx-auto h-24 w-24 text-theme-text-tertiary"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1"
								d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h3 class="mt-6 text-lg font-medium text-theme-text-primary">
							Noch keine Welten vorhanden
						</h3>
						<p class="mt-2 text-sm text-theme-text-secondary">
							Beginne dein Abenteuer, indem du deine erste Welt erschaffst.
						</p>
						<div class="mt-6">
							<a
								href="/worlds/new"
								class="inline-flex items-center rounded-md border border-transparent bg-theme-primary-600 px-6 py-3 text-base font-medium text-theme-inverse hover:bg-theme-primary-700"
							>
								<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Erste Welt erschaffen
							</a>
						</div>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each worlds as world}
							<button
								onclick={() => enterWorld(world)}
								class="group relative transform overflow-hidden rounded-lg bg-theme-surface text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
							>
								<!-- World Card Background with Image -->
								<div
									class="relative h-48 overflow-hidden bg-gradient-to-br from-theme-primary-500 to-theme-primary-600"
								>
									{#if world.image_url}
										<img
											src={world.image_url}
											alt={world.title}
											class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
										/>
										<div
											class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
										></div>
									{:else}
										<!-- Fallback pattern for worlds without images -->
										<div class="absolute inset-0 opacity-10">
											<svg class="h-full w-full" viewBox="0 0 100 100" fill="currentColor">
												<pattern
													id="world-pattern-{world.id}"
													patternUnits="userSpaceOnUse"
													width="20"
													height="20"
												>
													<circle cx="10" cy="10" r="1.5" />
												</pattern>
												<rect width="100" height="100" fill="url(#world-pattern-{world.id})" />
											</svg>
										</div>
									{/if}
								</div>

								<!-- World Content -->
								<div class="p-6">
									<h3
										class="text-xl font-bold text-theme-text-primary transition-colors group-hover:text-theme-primary-600"
									>
										{world.title}
									</h3>
									{#if world.summary}
										<p class="mt-2 line-clamp-2 text-sm text-theme-text-secondary">
											{world.summary}
										</p>
									{/if}

									<!-- World Stats -->
									<div class="mt-4 flex items-center justify-between">
										<div class="flex space-x-2">
											{#if world.tags && world.tags.length > 0}
												{#each world.tags.slice(0, 2) as tag}
													<span
														class="inline-flex items-center rounded-full bg-theme-primary-100 px-2.5 py-0.5 text-xs font-medium text-theme-primary-700"
													>
														{tag}
													</span>
												{/each}
											{/if}
										</div>
										<span class="inline-flex items-center text-sm text-theme-text-secondary">
											<svg
												class="mr-1 h-4 w-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 7l5 5m0 0l-5 5m5-5H6"
												/>
											</svg>
											Betreten
										</span>
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
