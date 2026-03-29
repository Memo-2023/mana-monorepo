<script lang="ts">
	import { api } from '$lib/api/client';
	import { addJob } from '$lib/stores/jobs';
	import { goto } from '$app/navigation';

	let url = $state('');
	let language = $state('de');
	let provider = $state<'openai' | 'local'>('openai');
	let model = $state<'tiny' | 'base' | 'small' | 'medium' | 'large'>('base');
	let loading = $state(false);
	let error = $state<string | null>(null);

	const languages = [
		{ code: 'de', name: 'German' },
		{ code: 'en', name: 'English' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'fr', name: 'French' },
		{ code: 'it', name: 'Italian' },
		{ code: 'pt', name: 'Portuguese' },
		{ code: 'ja', name: 'Japanese' },
		{ code: 'ko', name: 'Korean' },
		{ code: 'zh', name: 'Chinese' },
	];

	const models = [
		{ value: 'tiny', label: 'Tiny (39 MB, ~10x speed)' },
		{ value: 'base', label: 'Base (74 MB, ~7x speed)' },
		{ value: 'small', label: 'Small (244 MB, ~4x speed)' },
		{ value: 'medium', label: 'Medium (769 MB, ~2x speed)' },
		{ value: 'large', label: 'Large (1.5 GB, best accuracy)' },
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		loading = true;

		try {
			const job = await api.createJob({
				url,
				language,
				provider,
				model: provider === 'local' ? model : undefined,
			});
			addJob(job);
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to start transcription';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>New Transcription | Wisekeep</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">New Transcription</h1>

	{#if error}
		<div class="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
	{/if}

	<form onsubmit={handleSubmit} class="bg-white rounded-lg shadow-sm border p-6 space-y-6">
		<div>
			<label for="url" class="block text-sm font-medium text-gray-700 mb-2"> YouTube URL </label>
			<input
				type="url"
				id="url"
				bind:value={url}
				placeholder="https://www.youtube.com/watch?v=..."
				required
				class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
			/>
		</div>

		<div>
			<label for="language" class="block text-sm font-medium text-gray-700 mb-2"> Language </label>
			<select
				id="language"
				bind:value={language}
				class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
			>
				{#each languages as lang}
					<option value={lang.code}>{lang.name}</option>
				{/each}
			</select>
		</div>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2"> Transcription Provider </label>
			<div class="flex gap-4">
				<label class="flex items-center gap-2">
					<input type="radio" bind:group={provider} value="openai" />
					<span>OpenAI Whisper API</span>
				</label>
				<label class="flex items-center gap-2">
					<input type="radio" bind:group={provider} value="local" />
					<span>Local Whisper</span>
				</label>
			</div>
			<p class="text-sm text-gray-500 mt-1">
				{provider === 'openai'
					? 'Fast, cloud-based transcription (~$0.006/min)'
					: 'Free, requires local Whisper installation'}
			</p>
		</div>

		{#if provider === 'local'}
			<div>
				<label for="model" class="block text-sm font-medium text-gray-700 mb-2">
					Whisper Model
				</label>
				<select
					id="model"
					bind:value={model}
					class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
				>
					{#each models as m}
						<option value={m.value}>{m.label}</option>
					{/each}
				</select>
			</div>
		{/if}

		<button
			type="submit"
			disabled={loading || !url}
			class="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{loading ? 'Starting...' : 'Start Transcription'}
		</button>
	</form>
</div>
