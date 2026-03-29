<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	const { data }: { data: PageData } = $props();

	const baseUrl = 'https://ulo.ad';

	// Simple card renderer without complex dependencies
	function renderSimpleCard(card: any) {
		if (!card?.config) return null;

		// Handle different card modes
		if (card.config.mode === 'beginner' && card.config.modules) {
			// Simple module-based rendering
			return card.config.modules;
		} else if (card.config.mode === 'advanced') {
			// Template-based card
			return {
				template: card.config.template,
				values: card.config.values,
			};
		} else if (card.config.mode === 'expert') {
			// Custom HTML card
			return {
				html: card.config.html,
				css: card.config.css,
			};
		}
		return null;
	}
</script>

<svelte:head>
	<title>{data.profileUser.name || data.profileUser.username} | Uload</title>
	<meta
		name="description"
		content={data.profileUser.bio ||
			`Check out ${data.profileUser.name || data.profileUser.username}'s links on Uload`}
	/>
</svelte:head>

<div
	class="min-h-screen transition-colors duration-300"
	style="background: {data.profileUser.profileBackground || '#f9fafb'}; 
		   {data.profileUser.profileBackground && !data.profileUser.profileBackground.startsWith('#f')
		? 'background: linear-gradient(135deg, ' +
			data.profileUser.profileBackground +
			' 0%, ' +
			data.profileUser.profileBackground +
			'dd 100%);'
		: ''}"
>
	<div class="mx-auto max-w-2xl px-4 py-8 sm:py-12">
		<!-- Profile Header Card -->
		<div class="mb-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
			<div class="text-center">
				<!-- Avatar -->
				{#if data.profileUser.avatarUrl}
					<img
						src={data.profileUser.avatarUrl}
						alt={data.profileUser.name || data.profileUser.username}
						class="mx-auto mb-5 h-28 w-28 rounded-full object-cover shadow-lg sm:h-36 sm:w-36"
					/>
				{:else}
					<div
						class="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg sm:h-36 sm:w-36"
					>
						<span class="text-4xl font-bold text-white sm:text-5xl">
							{(data.profileUser.name || data.profileUser.username).charAt(0).toUpperCase()}
						</span>
					</div>
				{/if}

				<!-- Name and Username -->
				<h1 class="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
					{data.profileUser.name || data.profileUser.username}
				</h1>
				<p class="mb-4 text-lg text-gray-500">@{data.profileUser.username}</p>

				<!-- Bio -->
				{#if data.profileUser.bio}
					<p class="mx-auto mb-6 max-w-md text-lg text-gray-700">{data.profileUser.bio}</p>
				{/if}

				<!-- Social Links - Larger and more prominent -->
				<div class="flex flex-wrap justify-center gap-3">
					{#if data.profileUser.website}
						<a
							href={data.profileUser.website}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex transform items-center rounded-full bg-gray-100 px-5 py-2.5 transition-all hover:scale-105 hover:bg-gray-200"
						>
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" />
								<path d="M7.5 7.5A.5.5 0 018 7h4a.5.5 0 010 1H8.5v3.5a.5.5 0 01-1 0v-4z" />
							</svg>
							<span class="font-medium">Website</span>
						</a>
					{/if}
					{#if data.profileUser.twitter}
						<a
							href={`https://twitter.com/${data.profileUser.twitter}`}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex transform items-center rounded-full bg-sky-100 px-5 py-2.5 transition-all hover:scale-105 hover:bg-sky-200"
						>
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
								/>
							</svg>
							<span class="font-medium">Twitter</span>
						</a>
					{/if}
					{#if data.profileUser.github}
						<a
							href={`https://github.com/${data.profileUser.github}`}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex transform items-center rounded-full bg-gray-900 px-5 py-2.5 text-white transition-all hover:scale-105 hover:bg-gray-800"
						>
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
								/>
							</svg>
							<span class="font-medium">GitHub</span>
						</a>
					{/if}
					{#if data.profileUser.linkedin}
						<a
							href={`https://linkedin.com/in/${data.profileUser.linkedin}`}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex transform items-center rounded-full bg-blue-100 px-5 py-2.5 transition-all hover:scale-105 hover:bg-blue-200"
						>
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
								/>
							</svg>
							<span class="font-medium">LinkedIn</span>
						</a>
					{/if}
					{#if data.profileUser.instagram}
						<a
							href={`https://instagram.com/${data.profileUser.instagram}`}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex transform items-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2.5 text-white transition-all hover:scale-105 hover:from-purple-600 hover:to-pink-600"
						>
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"
								/>
							</svg>
							<span class="font-medium">Instagram</span>
						</a>
					{/if}
				</div>
			</div>
		</div>

		<!-- Main Content Section -->
		{#if data.cards && data.cards.length > 0}
			<!-- User Cards Section (shown when cards exist) -->
			<div class="mb-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Featured Cards</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each data.cards as card}
						<div
							class="overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:shadow-md"
						>
							{#if card.config?.mode === 'beginner' && card.config.modules}
								<!-- Simple module-based card -->
								<div class="p-5">
									{#each card.config.modules as module}
										{#if module.type === 'header'}
											<div class="mb-4">
												{#if module.props?.title}
													<h3 class="text-xl font-semibold text-gray-900">{module.props.title}</h3>
												{/if}
												{#if module.props?.subtitle}
													<p class="mt-1 text-base text-gray-600">{module.props.subtitle}</p>
												{/if}
											</div>
										{:else if module.type === 'content'}
											<div class="mb-4">
												<p class="text-base leading-relaxed text-gray-700">
													{module.props?.text || module.props?.html || ''}
												</p>
											</div>
										{:else if module.type === 'media' && module.props?.type === 'image'}
											<div class="-mx-5 -mt-5 mb-4">
												<img
													src={module.props.src}
													alt={module.props.alt || ''}
													class="h-auto w-full"
												/>
											</div>
										{:else if module.type === 'links' && module.props?.links}
											<div class="mt-4 flex flex-wrap gap-3">
												{#each module.props.links as link}
													<a
														href={link.href}
														target="_blank"
														rel="noopener noreferrer"
														class="inline-flex transform items-center rounded-full bg-indigo-600 px-5 py-2.5 font-medium text-white transition-all hover:scale-105 hover:bg-indigo-700"
													>
														{link.label}
													</a>
												{/each}
											</div>
										{/if}
									{/each}
								</div>
							{:else if card.config?.mode === 'advanced'}
								<!-- Template-based card -->
								<div class="p-5">
									<div class="text-gray-700">
										{#if card.config.template}
											<!-- Simple template display without variable replacement for now -->
											<p class="mb-2 text-sm uppercase tracking-wide text-gray-500">
												Template Card
											</p>
											{#if card.metadata?.name}
												<h3 class="mb-2 text-xl font-semibold text-gray-900">
													{card.metadata.name}
												</h3>
											{/if}
											{#if card.metadata?.description}
												<p class="text-base text-gray-600">{card.metadata.description}</p>
											{/if}
										{/if}
									</div>
								</div>
							{:else if card.config?.mode === 'expert'}
								<!-- Custom HTML card -->
								<div class="p-5">
									<div class="text-gray-700">
										<p class="mb-2 text-sm uppercase tracking-wide text-gray-500">Custom Card</p>
										{#if card.metadata?.name}
											<h3 class="mb-2 text-xl font-semibold text-gray-900">{card.metadata.name}</h3>
										{/if}
										{#if card.metadata?.description}
											<p class="text-base text-gray-600">{card.metadata.description}</p>
										{/if}
									</div>
								</div>
							{:else}
								<!-- Fallback for unknown card types -->
								<div class="p-5">
									<p class="text-base text-gray-500">Card content unavailable</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- No cards - show basic info message -->
			<div class="rounded-xl bg-white p-8 shadow-sm">
				<p class="text-center text-gray-500">
					Welcome to {data.profileUser.name || data.profileUser.username}'s profile.
				</p>
				<p class="mt-2 text-center text-sm text-gray-400">No content available yet.</p>
			</div>
		{/if}

		<!-- Footer -->
		<div class="mt-12 text-center text-sm text-gray-500">
			<a href="/" class="transition-colors hover:text-gray-700"> Powered by Uload </a>
		</div>
	</div>
</div>
