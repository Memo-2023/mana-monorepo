<script lang="ts">
	import type { PageData } from './$types';
	import { getManaEventsUrl } from '$lib/api/config';
	import { getStrings } from './strings';

	let { data }: { data: PageData } = $props();
	const t = $derived(getStrings(data.lang));

	let name = $state('');
	let email = $state('');
	let status = $state<'yes' | 'no' | 'maybe'>('yes');
	let plusOnes = $state(0);
	let note = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let errorMessage = $state<string | null>(null);

	// Local mirror of items so claims can update the UI without a page
	// reload. SSR data is the initial source of truth.
	// svelte-ignore state_referenced_locally
	let items = $state(data.items);
	let claimingItemId = $state<string | null>(null);
	let claimError = $state<string | null>(null);

	async function claimItem(itemId: string) {
		if (claimingItemId) return;
		const claimerName = window.prompt(t.claimNamePrompt, name)?.trim();
		if (!claimerName) return;

		claimingItemId = itemId;
		claimError = null;
		try {
			const res = await fetch(
				`${getManaEventsUrl()}/api/v1/rsvp/${data.token}/items/${itemId}/claim`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: claimerName }),
				}
			);
			if (!res.ok) {
				if (res.status === 400) {
					claimError = t.claimAlreadyTaken;
				} else {
					const err = await res.json().catch(() => ({ message: 'Fehler' }));
					throw new Error(err.message || `HTTP ${res.status}`);
				}
				return;
			}
			// Optimistically reflect the claim locally
			items = items.map((it) => (it.id === itemId ? { ...it, claimedByName: claimerName } : it));
			// Pre-fill the RSVP name field for convenience
			if (!name) name = claimerName;
		} catch (e) {
			claimError = e instanceof Error ? e.message : t.genericError;
		} finally {
			claimingItemId = null;
		}
	}

	const startDate = $derived(new Date(data.event.startAt));
	const dateLabel = $derived(
		startDate.toLocaleDateString(t.dateLocale, {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		})
	);
	const timeLabel = $derived(
		data.event.allDay
			? t.allDay
			: startDate.toLocaleTimeString(t.dateLocale, { hour: '2-digit', minute: '2-digit' })
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
			errorMessage = e instanceof Error ? e.message : t.genericError;
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{data.event.title} {t.pageTitleSuffix}</title>
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
						<strong>{data.summary.totalAttending}</strong>
						{t.peopleAttending}
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

		{#if items.length > 0 && !data.cancelled}
			<section class="bring-list">
				<h2>{t.bringListHeading}</h2>
				<ul>
					{#each items as item (item.id)}
						<li class="bring-item" class:claimed={!!item.claimedByName}>
							<div class="bring-info">
								<span class="bring-label">{item.label}</span>
								{#if item.quantity}
									<span class="bring-qty">×{item.quantity}</span>
								{/if}
								{#if item.claimedByName}
									<span class="bring-claimed">{t.claimedBy(item.claimedByName)}</span>
								{/if}
							</div>
							{#if !item.claimedByName}
								<button
									type="button"
									class="claim-btn"
									disabled={claimingItemId === item.id}
									onclick={() => claimItem(item.id)}
								>
									{claimingItemId === item.id ? '…' : t.claimButton}
								</button>
							{/if}
						</li>
					{/each}
				</ul>
				{#if claimError}
					<p class="claim-error">{claimError}</p>
				{/if}
			</section>
		{/if}

		{#if data.cancelled}
			<div class="cancelled">{t.cancelledNotice}</div>
		{:else if submitted}
			<div class="success">
				<h2>{t.successHeading}</h2>
				<p>
					{t.successYou}
					<strong>
						{status === 'yes'
							? t.successComing
							: status === 'no'
								? t.successNotComing
								: t.successMaybe}
					</strong>
					{t.successHint}
				</p>
				<button
					class="action-btn"
					onclick={() => {
						submitted = false;
					}}
				>
					{t.changeAnswer}
				</button>
			</div>
		{:else}
			<form class="rsvp-form" onsubmit={handleSubmit}>
				<h2>{t.formHeading}</h2>

				<label class="field">
					<span class="label">{t.yourName}</span>
					<input
						type="text"
						bind:value={name}
						placeholder={t.yourNamePlaceholder}
						required
						maxlength="100"
					/>
				</label>

				<label class="field">
					<span class="label">{t.emailLabel}</span>
					<input type="email" bind:value={email} placeholder={t.emailPlaceholder} maxlength="200" />
				</label>

				<div class="field">
					<span class="label">{t.areYouComing}</span>
					<div class="status-pills">
						<button
							type="button"
							class="pill"
							class:active={status === 'yes'}
							onclick={() => (status = 'yes')}
						>
							{t.yesComing}
						</button>
						<button
							type="button"
							class="pill"
							class:active={status === 'maybe'}
							onclick={() => (status = 'maybe')}
						>
							{t.maybe}
						</button>
						<button
							type="button"
							class="pill"
							class:active={status === 'no'}
							onclick={() => (status = 'no')}
						>
							{t.no}
						</button>
					</div>
				</div>

				{#if status === 'yes'}
					<label class="field">
						<span class="label">{t.bringingPeople(plusOnes)}</span>
						<input type="range" min="0" max="10" bind:value={plusOnes} />
					</label>
				{/if}

				<label class="field">
					<span class="label">{t.noteLabel}</span>
					<textarea bind:value={note} placeholder={t.notePlaceholder} rows="2" maxlength="1000"
					></textarea>
				</label>

				{#if errorMessage}
					<div class="error">{errorMessage}</div>
				{/if}

				<button type="submit" class="submit-btn" disabled={submitting || !name.trim()}>
					{submitting ? t.sending : t.send}
				</button>
			</form>
		{/if}
	</div>

	<footer class="footer">
		{t.poweredBy} <a href="https://mana.how" target="_blank" rel="noopener">Mana</a>
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
	.bring-list {
		margin: 0 0 1.5rem;
		padding: 1rem;
		background: #fef9fb;
		border: 1px solid #fce4eb;
		border-radius: 0.625rem;
	}
	.bring-list h2 {
		margin: 0 0 0.625rem;
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #be123c;
	}
	.bring-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.bring-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: white;
		border: 1px solid #fce4eb;
		border-radius: 0.5rem;
	}
	.bring-item.claimed {
		background: #f9fafb;
		border-color: #e5e7eb;
	}
	.bring-info {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: baseline;
		font-size: 0.875rem;
	}
	.bring-label {
		font-weight: 500;
		color: #111827;
	}
	.bring-item.claimed .bring-label {
		color: #6b7280;
	}
	.bring-qty {
		font-size: 0.75rem;
		color: #6b7280;
	}
	.bring-claimed {
		font-size: 0.75rem;
		color: #16a34a;
		font-style: italic;
	}
	.claim-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid #f43f5e;
		border-radius: 0.375rem;
		background: white;
		color: #be123c;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}
	.claim-btn:hover:not(:disabled) {
		background: #fff1f3;
	}
	.claim-btn:disabled {
		opacity: 0.5;
		cursor: wait;
	}
	.claim-error {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: #dc2626;
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
