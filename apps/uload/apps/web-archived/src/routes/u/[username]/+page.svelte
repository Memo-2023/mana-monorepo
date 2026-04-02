<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const ULOAD_SERVER = import.meta.env.PUBLIC_ULOAD_SERVER_URL || 'http://localhost:3070';

	let username = $derived($page.params.username ?? '');
	let user = $state<{ username: string; name: string | null; bio: string | null } | null>(null);
	let userLinks = $state<
		{
			shortCode: string;
			title: string | null;
			description: string | null;
			clickCount: number;
			createdAt: string;
		}[]
	>([]);
	let loading = $state(true);
	let notFound = $state(false);

	onMount(async () => {
		try {
			const res = await fetch(`${ULOAD_SERVER}/public/u/${username}`);
			if (res.ok) {
				const data = await res.json();
				user = data.user;
				userLinks = data.links;
			} else {
				notFound = true;
			}
		} catch {
			notFound = true;
		}
		loading = false;
	});
</script>

<div class="mx-auto max-w-2xl px-4 py-12">
	{#if loading}
		<div class="flex justify-center py-20">
			<div
				class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"
			></div>
		</div>
	{:else if notFound}
		<div class="py-20 text-center">
			<p class="text-6xl">🔗</p>
			<h1 class="mt-4 text-2xl font-bold">Nutzer nicht gefunden</h1>
			<p class="mt-2 text-sm opacity-50">
				@{username} existiert nicht oder hat kein öffentliches Profil.
			</p>
			<a
				href="/"
				class="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>Zur Startseite</a
			>
		</div>
	{:else if user}
		<!-- Profile Header -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
			>
				{(user.name || user.username).charAt(0).toUpperCase()}
			</div>
			<h1 class="text-2xl font-bold">{user.name || user.username}</h1>
			<p class="text-sm opacity-50">@{user.username}</p>
			{#if user.bio}
				<p class="mt-2 text-sm opacity-70">{user.bio}</p>
			{/if}
		</div>

		<!-- Links -->
		{#if userLinks.length === 0}
			<p class="text-center text-sm opacity-40">Keine öffentlichen Links</p>
		{:else}
			<div class="space-y-3">
				{#each userLinks as link}
					<a
						href="/{link.shortCode}"
						class="block rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-semibold">{link.title || link.shortCode}</h3>
								{#if link.description}
									<p class="mt-1 text-sm opacity-60">{link.description}</p>
								{/if}
							</div>
							<div class="text-right text-sm opacity-50">
								<p>{link.clickCount} clicks</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
