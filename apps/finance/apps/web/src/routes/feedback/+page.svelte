<script lang="ts">
	let type = $state<'bug' | 'feature' | 'other'>('feature');
	let message = $state('');
	let email = $state('');
	let isSubmitting = $state(false);
	let success = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = null;

		try {
			// TODO: Implement feedback submission
			console.log('Feedback:', { type, message, email });
			success = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Feedback konnte nicht gesendet werden';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Feedback | Finance</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold">Feedback</h1>

	{#if success}
		<div class="rounded-lg border border-green-500/50 bg-green-500/10 p-8 text-center">
			<div class="mb-4 text-4xl">✅</div>
			<h2 class="text-xl font-semibold text-green-600">Vielen Dank für Ihr Feedback!</h2>
			<p class="mt-2 text-muted-foreground">Wir werden uns Ihre Nachricht ansehen.</p>
			<a
				href="/"
				class="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
			>
				Zurück zur Startseite
			</a>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="rounded-lg border border-border bg-card p-6">
				<h2 class="mb-4 text-lg font-semibold">Was möchten Sie uns mitteilen?</h2>

				<div class="mb-4 flex gap-2">
					<button
						type="button"
						onclick={() => (type = 'bug')}
						class="rounded-lg px-4 py-2 {type === 'bug'
							? 'bg-red-500 text-white'
							: 'border border-border hover:bg-accent'}"
					>
						🐛 Bug melden
					</button>
					<button
						type="button"
						onclick={() => (type = 'feature')}
						class="rounded-lg px-4 py-2 {type === 'feature'
							? 'bg-blue-500 text-white'
							: 'border border-border hover:bg-accent'}"
					>
						💡 Feature-Wunsch
					</button>
					<button
						type="button"
						onclick={() => (type = 'other')}
						class="rounded-lg px-4 py-2 {type === 'other'
							? 'bg-gray-500 text-white'
							: 'border border-border hover:bg-accent'}"
					>
						💬 Sonstiges
					</button>
				</div>

				<div class="space-y-4">
					<div>
						<label for="message" class="mb-1 block text-sm font-medium">Ihre Nachricht</label>
						<textarea
							id="message"
							bind:value={message}
							required
							rows="6"
							class="w-full rounded-lg border border-border bg-background px-3 py-2"
							placeholder="Beschreiben Sie Ihr Anliegen..."
						></textarea>
					</div>

					<div>
						<label for="email" class="mb-1 block text-sm font-medium">E-Mail (optional)</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							class="w-full rounded-lg border border-border bg-background px-3 py-2"
							placeholder="ihre@email.de"
						/>
						<p class="mt-1 text-xs text-muted-foreground">
							Falls wir Rückfragen haben oder Sie über Updates informieren möchten
						</p>
					</div>
				</div>
			</div>

			{#if error}
				<div class="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
			{/if}

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting || !message.trim()}
					class="rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{isSubmitting ? 'Senden...' : 'Feedback senden'}
				</button>
			</div>
		</form>
	{/if}
</div>
