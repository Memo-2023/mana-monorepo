<script lang="ts">
	import type { PageData } from './$types';
	import { getManaEventsUrl } from '$lib/api/config';

	let { data }: { data: PageData } = $props();

	let name = $state('');
	let email = $state('');
	let status = $state<'yes' | 'no' | 'maybe'>('yes');
	let plusOnes = $state(0);
	let note = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let errorMessage = $state<string | null>(null);

	const startDate = $derived(new Date(data.event.startAt));
	const dateLabel = $derived(
		startDate.toLocaleDateString('de-DE', {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		})
	);
	const timeLabel = $derived(
		data.event.allDay
			? 'Ganztägig'
			: startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		submitting = true;
		errorMessage = null;
		try {
			const res = await fetch(`${getManaEventsUrl()}/api/v1/rsvp/${data.token}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim() || null,
					status,
					plusOnes,
					note: note.trim() || null,
				}),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Fehler' }));
				throw new Error(err.message || `HTTP ${res.status}`);
			}
			submitted = true;
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Konnte nicht senden';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{data.event.title} — RSVP</title>
</svelte:head>

<div class="rsvp-page">
	<div class="card" style:border-top-color={data.event.color ?? '#f43f5e'}>
		<h1 class="title">{data.event.title}</h1>

		<div class="meta">
			<div class="meta-row">
				<span class="icon">📅</span>
				<div>
					<div>{dateLabel}</div>
					<div class="muted">{timeLabel}</div>
				</div>
			</div>
			{#if data.event.location}
				<div class="meta-row">
					<span class="icon">📍</span>
					<div>
						{#if data.event.locationUrl}
							<a href={data.event.locationUrl} target="_blank" rel="noopener noreferrer">
								{data.event.location}
							</a>
						{:else}
							{data.event.location}
						{/if}
					</div>
				</div>
			{/if}
			{#if data.summary}
				<div class="meta-row">
					<span class="icon">👥</span>
					<div>
						<strong>{data.summary.totalAttending}</strong> Personen kommen
						{#if data.event.capacity}
							<span class="muted">/ {data.event.capacity}</span>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		{#if data.event.description}
			<p class="description">{data.event.description}</p>
		{/if}

		{#if data.cancelled}
			<div class="cancelled">⚠️ Dieses Event wurde abgesagt.</div>
		{:else if submitted}
			<div class="success">
				<h2>Danke für deine Antwort!</h2>
				<p>
					Du hast mit
					<strong>
						{status === 'yes' ? '„Ja, komme“' : status === 'no' ? '„Nein“' : '„Vielleicht“'}
					</strong>
					geantwortet. Du kannst diese Seite jederzeit erneut öffnen, um deine Antwort zu ändern.
				</p>
				<button
					class="action-btn"
					onclick={() => {
						submitted = false;
					}}
				>
					Antwort ändern
				</button>
			</div>
		{:else}
			<form class="rsvp-form" onsubmit={handleSubmit}>
				<h2>Sag bitte zu</h2>

				<label class="field">
					<span class="label">Dein Name</span>
					<input
						type="text"
						bind:value={name}
						placeholder="z. B. Anna Schmidt"
						required
						maxlength="100"
					/>
				</label>

				<label class="field">
					<span class="label">E-Mail (optional)</span>
					<input type="email" bind:value={email} placeholder="anna@example.com" maxlength="200" />
				</label>

				<div class="field">
					<span class="label">Kommst du?</span>
					<div class="status-pills">
						<button
							type="button"
							class="pill"
							class:active={status === 'yes'}
							onclick={() => (status = 'yes')}
						>
							✓ Ja, komme
						</button>
						<button
							type="button"
							class="pill"
							class:active={status === 'maybe'}
							onclick={() => (status = 'maybe')}
						>
							? Vielleicht
						</button>
						<button
							type="button"
							class="pill"
							class:active={status === 'no'}
							onclick={() => (status = 'no')}
						>
							✕ Nein
						</button>
					</div>
				</div>

				{#if status === 'yes'}
					<label class="field">
						<span class="label">Bringst du jemanden mit? ({plusOnes})</span>
						<input type="range" min="0" max="10" bind:value={plusOnes} />
					</label>
				{/if}

				<label class="field">
					<span class="label">Notiz (optional)</span>
					<textarea
						bind:value={note}
						placeholder="z. B. „Komme erst um 20 Uhr“"
						rows="2"
						maxlength="1000"
					></textarea>
				</label>

				{#if errorMessage}
					<div class="error">{errorMessage}</div>
				{/if}

				<button type="submit" class="submit-btn" disabled={submitting || !name.trim()}>
					{submitting ? 'Sende...' : 'Antwort senden'}
				</button>
			</form>
		{/if}
	</div>

	<footer class="footer">
		Powered by <a href="https://mana.how" target="_blank" rel="noopener">Mana</a>
	</footer>
</div>

<style>
	:global(body) {
		background: linear-gradient(135deg, #fef3f6 0%, #fde7ec 100%);
	}
	.rsvp-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1rem;
	}
	.card {
		width: 100%;
		max-width: 540px;
		background: white;
		border-radius: 1rem;
		border-top: 6px solid #f43f5e;
		box-shadow:
			0 4px 24px rgba(0, 0, 0, 0.06),
			0 1px 4px rgba(0, 0, 0, 0.04);
		padding: 2rem;
	}
	.title {
		margin: 0 0 1rem;
		font-size: 1.875rem;
		font-weight: 700;
		color: #111827;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid #f3f4f6;
	}
	.meta-row {
		display: flex;
		gap: 0.75rem;
		font-size: 0.9375rem;
		color: #374151;
	}
	.meta-row .icon {
		font-size: 1.125rem;
	}
	.meta-row a {
		color: #f43f5e;
		text-decoration: none;
	}
	.meta-row a:hover {
		text-decoration: underline;
	}
	.muted {
		color: #6b7280;
		font-size: 0.875rem;
	}
	.description {
		margin: 0 0 1.5rem;
		font-size: 0.9375rem;
		color: #374151;
		white-space: pre-wrap;
		line-height: 1.5;
	}
	.cancelled {
		padding: 1rem;
		border-radius: 0.5rem;
		background: #fef2f2;
		color: #dc2626;
		font-weight: 500;
		text-align: center;
	}

	.rsvp-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.rsvp-form h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.field input[type='text'],
	.field input[type='email'],
	.field textarea {
		padding: 0.625rem 0.875rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background: white;
		font-size: 0.9375rem;
		color: #111827;
		font-family: inherit;
	}
	.field input:focus,
	.field textarea:focus {
		outline: none;
		border-color: #f43f5e;
		box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.15);
	}
	.field textarea {
		resize: vertical;
	}
	.status-pills {
		display: flex;
		gap: 0.5rem;
	}
	.pill {
		flex: 1;
		padding: 0.625rem 0.5rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.625rem;
		background: white;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.15s;
	}
	.pill:hover {
		border-color: #d1d5db;
	}
	.pill.active {
		border-color: #f43f5e;
		background: #fff1f3;
		color: #be123c;
	}
	.field input[type='range'] {
		width: 100%;
		accent-color: #f43f5e;
	}
	.error {
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		background: #fef2f2;
		color: #dc2626;
		font-size: 0.875rem;
	}
	.submit-btn {
		padding: 0.875rem;
		border: none;
		border-radius: 0.625rem;
		background: linear-gradient(135deg, #f43f5e, #be123c);
		color: white;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.submit-btn:hover:not(:disabled) {
		opacity: 0.95;
	}
	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.success {
		padding: 1.5rem;
		text-align: center;
		background: #f0fdf4;
		border-radius: 0.625rem;
		color: #166534;
	}
	.success h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: #15803d;
	}
	.success p {
		margin: 0 0 1rem;
		font-size: 0.875rem;
	}
	.action-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #15803d;
		border-radius: 0.5rem;
		background: white;
		color: #15803d;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.footer {
		margin-top: 1.5rem;
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.footer a {
		color: #f43f5e;
		text-decoration: none;
	}
</style>
