<script lang="ts">
	import type { PageData } from './$types';
	
	const { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-4xl mx-auto px-4 py-8">
		<!-- Profile Header -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<div class="flex items-center space-x-4">
				{#if data.user.avatarUrl}
					<img 
						src={data.user.avatarUrl} 
						alt={data.user.name || data.user.username}
						class="w-20 h-20 rounded-full object-cover"
					/>
				{:else}
					<div class="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
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
		<div class="bg-white rounded-lg shadow-sm p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Public Links</h2>
			
			{#if data.links.length > 0}
				<div class="space-y-3">
					{#each data.links as link}
						<a 
							href="/u/{data.user.username}/{link.short_code}"
							class="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
						>
							<div class="flex justify-between items-start">
								<div>
									<h3 class="font-medium text-gray-900">
										{link.title || `Link ${link.short_code}`}
									</h3>
									<p class="text-sm text-gray-500 mt-1">
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
				<p class="text-gray-500 text-center py-8">
					No public links available
				</p>
			{/if}
		</div>
	</div>
</div>