<script lang="ts">
	import GenerateForm from '$lib/components/generate/GenerateForm.svelte';
</script>

<svelte:head>
	<title>Generate - Picture</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Generate Image</h1>
		<p class="mt-2 text-gray-600">
			Create stunning AI-generated images from your text descriptions
		</p>
	</div>

	<div class="mx-auto max-w-3xl">
		<GenerateForm />
	</div>

	<!-- Tips Section -->
	<div class="mx-auto mt-8 max-w-3xl">
		<div class="rounded-lg border border-gray-200 bg-gray-50 p-6">
			<h3 class="mb-3 text-lg font-semibold text-gray-900">Tips for better results:</h3>
			<ul class="space-y-2 text-sm text-gray-700">
				<li class="flex items-start">
					<svg
						class="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span
						><strong>Be specific:</strong> Include details about style, mood, colors, and composition</span
					>
				</li>
				<li class="flex items-start">
					<svg
						class="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span
						><strong>Use descriptive words:</strong> "Vibrant sunset over mountains" is better than "sunset"</span
					>
				</li>
				<li class="flex items-start">
					<svg
						class="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span
						><strong>Negative prompts:</strong> Use to exclude unwanted elements (e.g., "blurry, distorted,
						low quality")</span
					>
				</li>
				<li class="flex items-start">
					<svg
						class="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span
						><strong>Try different models:</strong> Each model has unique strengths and artistic styles</span
					>
				</li>
			</ul>
		</div>
	</div>
</div>
