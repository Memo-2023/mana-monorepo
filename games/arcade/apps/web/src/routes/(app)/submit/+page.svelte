<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';

	const BACKEND_URL = import.meta.env.DEV
		? 'http://localhost:3011'
		: import.meta.env.PUBLIC_MANA_GAMES_BACKEND_URL || '';

	let title = $state('');
	let description = $state('');
	let controls = $state('');
	let difficulty = $state<'Einfach' | 'Mittel' | 'Schwer'>('Mittel');
	let tags = $state('');
	let htmlCode = $state('');
	let authorName = $state('');
	let isSubmitting = $state(false);
	let submitResult = $state<{ success: boolean; message: string } | null>(null);

	async function handleSubmit() {
		if (!title.trim() || !htmlCode.trim() || !authorName.trim()) return;

		isSubmitting = true;
		submitResult = null;

		try {
			const response = await fetch(`${BACKEND_URL}/api/games/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description,
					controls,
					difficulty,
					complexity: 'Mittel',
					tags: tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean),
					author: { name: authorName },
					files: { html: htmlCode },
					submittedAt: new Date().toISOString(),
				}),
			});

			const data = await response.json();
			submitResult = {
				success: data.success,
				message: data.success
					? `Eingereicht! PR #${data.prNumber} erstellt.`
					: data.error || 'Fehler beim Einreichen.',
			};

			if (data.success) {
				title = '';
				description = '';
				controls = '';
				tags = '';
				htmlCode = '';
			}
		} catch {
			submitResult = { success: false, message: 'Verbindungsfehler zum Backend.' };
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Spiel einreichen - Arcade</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">Spiel einreichen</h1>
		<p class="text-muted-foreground mt-1">Reiche dein eigenes HTML5-Spiel bei der Community ein.</p>
	</div>

	{#if !authStore.isAuthenticated}
		<div class="rounded-xl border border-border bg-card p-6 text-center">
			<p class="text-muted-foreground mb-4">Bitte melde dich an, um ein Spiel einzureichen.</p>
			<a
				href="/login"
				class="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
			>
				Anmelden
			</a>
		</div>
	{:else}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-4"
		>
			<div>
				<label for="title" class="block text-sm font-medium text-foreground mb-1">Titel *</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					required
					class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
				/>
			</div>

			<div>
				<label for="author" class="block text-sm font-medium text-foreground mb-1">Autor *</label>
				<input
					id="author"
					type="text"
					bind:value={authorName}
					required
					class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
				/>
			</div>

			<div>
				<label for="desc" class="block text-sm font-medium text-foreground mb-1">Beschreibung</label
				>
				<textarea
					id="desc"
					bind:value={description}
					rows="3"
					class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="controls" class="block text-sm font-medium text-foreground mb-1"
						>Steuerung</label
					>
					<input
						id="controls"
						type="text"
						bind:value={controls}
						placeholder="Pfeiltasten, Maus..."
						class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
				</div>
				<div>
					<label for="difficulty" class="block text-sm font-medium text-foreground mb-1"
						>Schwierigkeit</label
					>
					<select
						id="difficulty"
						bind:value={difficulty}
						class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
					>
						<option value="Einfach">Einfach</option>
						<option value="Mittel">Mittel</option>
						<option value="Schwer">Schwer</option>
					</select>
				</div>
			</div>

			<div>
				<label for="tags" class="block text-sm font-medium text-foreground mb-1"
					>Tags (kommagetrennt)</label
				>
				<input
					id="tags"
					type="text"
					bind:value={tags}
					placeholder="Arcade, Action, Puzzle"
					class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
				/>
			</div>

			<div>
				<label for="html" class="block text-sm font-medium text-foreground mb-1">HTML-Code *</label>
				<textarea
					id="html"
					bind:value={htmlCode}
					rows="12"
					required
					placeholder="<!DOCTYPE html>..."
					class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
				></textarea>
			</div>

			{#if submitResult}
				<div
					class="rounded-lg border p-3 text-sm {submitResult.success
						? 'border-green-500/30 bg-green-500/10 text-green-400'
						: 'border-red-500/30 bg-red-500/10 text-red-400'}"
				>
					{submitResult.message}
				</div>
			{/if}

			<button
				type="submit"
				disabled={!title.trim() || !htmlCode.trim() || !authorName.trim() || isSubmitting}
				class="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? 'Wird eingereicht...' : 'Spiel einreichen'}
			</button>
		</form>
	{/if}
</div>
