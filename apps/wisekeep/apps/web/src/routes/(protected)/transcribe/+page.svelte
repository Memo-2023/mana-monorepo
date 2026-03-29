<script lang="ts">
	import { transcriptCollection } from '$lib/data/local-store';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from 'svelte-sonner';

	const SERVER = import.meta.env.PUBLIC_WISEKEEP_SERVER_URL || 'http://localhost:3072';

	let url = $state('');
	let language = $state('de');
	let transcribing = $state(false);

	async function transcribe() {
		if (!url) return;
		transcribing = true;
		try {
			const token = authStore.isAuthenticated ? await authStore.getValidToken() : null;
			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			if (token) headers['Authorization'] = `Bearer ${token}`;

			const res = await fetch(`${SERVER}/api/v1/transcribe`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ url, language }),
			});

			if (!res.ok) throw new Error('Transcription failed');
			const result = await res.json();

			await transcriptCollection.insert({
				id: result.id,
				url,
				title: result.title,
				channel: result.channel,
				duration: result.duration,
				transcript: result.transcript,
				language: result.language,
				model: result.model,
				status: 'completed',
				isArchived: false,
			});

			toast.success(`"${result.title}" transkribiert!`);
			url = '';
		} catch (err) {
			toast.error('Transkription fehlgeschlagen. Ist der Server erreichbar?');
		}
		transcribing = false;
	}
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-6 text-3xl font-bold">Transkribieren</h1>

	<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
		<div class="space-y-4">
			<div>
				<label for="url" class="mb-1 block text-sm font-medium text-gray-300">YouTube URL</label>
				<input
					id="url"
					type="url"
					bind:value={url}
					placeholder="https://www.youtube.com/watch?v=..."
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none"
					onkeydown={(e) => e.key === 'Enter' && transcribe()}
				/>
			</div>
			<div>
				<label for="lang" class="mb-1 block text-sm font-medium text-gray-300">Sprache</label>
				<select
					id="lang"
					bind:value={language}
					class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
				>
					<option value="de">Deutsch</option>
					<option value="en">English</option>
					<option value="fr">Français</option>
					<option value="es">Español</option>
				</select>
			</div>
			<button
				onclick={transcribe}
				disabled={!url || transcribing}
				class="w-full rounded-lg bg-violet-600 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
			>
				{transcribing ? 'Wird transkribiert...' : 'Transkribieren'}
			</button>
		</div>
		{#if transcribing}
			<div class="mt-4 rounded-lg bg-violet-900/20 p-4 text-center">
				<div
					class="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-r-transparent"
				></div>
				<p class="text-sm text-violet-300">
					Video wird heruntergeladen und transkribiert... Dies kann einige Minuten dauern.
				</p>
			</div>
		{/if}
	</div>
</div>
