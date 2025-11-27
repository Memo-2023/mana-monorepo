<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-8">
		<!-- Profile Header -->
		<div class="mb-6 rounded-lg bg-white p-6 shadow-sm">
			<div class="flex items-center space-x-4">
				{#if data.user.avatarUrl}
					<img
						src={data.user.avatarUrl}
						alt={data.user.name || data.user.username}
						class="h-20 w-20 rounded-full object-cover"
					/>
				{:else}
					<div class="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
						<span class="text-2xl font-semibold text-indigo-600">
							{(data.user.name || data.user.username).charAt(0).toUpperCase()}
						</span>
					</div>
				{/if}

				<div>
					<h1 class="text-2xl font-bold text-gray-900">
						{data.user.name || data.user.username}
					</h1>
					<p class="text-gray-500">@{data.user.username}</p>
					{#if data.user.bio}
						<p class="mt-2 text-gray-700">{data.user.bio}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Links Section -->
		<div class="rounded-lg bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Public Links</h2>

			{#if data.links.length > 0}
				<div class="space-y-3">
					{#each data.links as link}
						<a
							href="/u/{data.user.username}/{link.short_code}"
							class="block rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
						>
							<div class="flex items-start justify-between">
								<div>
									<h3 class="font-medium text-gray-900">
										{link.title || `Link ${link.short_code}`}
									</h3>
									<p class="mt-1 text-sm text-gray-500">
										uload.de/u/{data.user.username}/{link.short_code}
									</p>
								</div>
								<div class="text-sm text-gray-500">
									{link.clicks} clicks
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<p class="py-8 text-center text-gray-500">No public links available</p>
			{/if}
		</div>
	</div>
</div>
