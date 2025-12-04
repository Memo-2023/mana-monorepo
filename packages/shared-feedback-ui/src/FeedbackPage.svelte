<script lang="ts">
	import type {
		FeedbackService,
		Feedback,
		CreateFeedbackInput,
	} from '@manacore/shared-feedback-service';
	import FeedbackForm from './FeedbackForm.svelte';
	import FeedbackList from './FeedbackList.svelte';

	interface Props {
		/** Pre-configured feedback service instance */
		feedbackService: FeedbackService;
		/** App name for display */
		appName: string;
		/** Current user ID for highlighting own feedback */
		currentUserId?: string;
		/** Page title */
		pageTitle?: string;
		/** Page subtitle */
		pageSubtitle?: string;
		/** Tab label for own feedback */
		myFeedbackLabel?: string;
		/** Tab label for community feedback */
		communityLabel?: string;
		/** Empty state message for own feedback */
		myFeedbackEmptyMessage?: string;
		/** Empty state message for community feedback */
		communityEmptyMessage?: string;
	}

	let {
		feedbackService,
		appName,
		currentUserId,
		pageTitle = 'Feedback & Vorschläge',
		pageSubtitle = 'Teile deine Ideen und stimme für Feature-Wünsche ab',
		myFeedbackLabel = 'Mein Feedback',
		communityLabel = 'Community',
		myFeedbackEmptyMessage = 'Du hast noch kein Feedback eingereicht',
		communityEmptyMessage = 'Noch keine öffentlichen Vorschläge',
	}: Props = $props();

	// State
	let activeTab = $state<'my' | 'community'>('community');
	let myFeedback = $state<Feedback[]>([]);
	let publicFeedback = $state<Feedback[]>([]);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let showForm = $state(false);
	let successMessage = $state('');

	// Load data on mount
	$effect(() => {
		loadFeedback();
	});

	async function loadFeedback() {
		isLoading = true;
		try {
			const [myResult, publicResult] = await Promise.all([
				feedbackService.getMyFeedback(),
				feedbackService.getPublicFeedback({ sort: 'votes' }),
			]);
			myFeedback = myResult.items;
			publicFeedback = publicResult.items;
		} catch (error) {
			console.error('[FeedbackPage] Error loading feedback:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit(input: CreateFeedbackInput) {
		isSubmitting = true;
		try {
			await feedbackService.createFeedback(input);
			showForm = false;
			successMessage = 'Feedback erfolgreich gesendet!';
			setTimeout(() => {
				successMessage = '';
			}, 3000);
			await loadFeedback();
		} finally {
			isSubmitting = false;
		}
	}

	async function handleVote(feedbackId: string, hasVoted: boolean) {
		try {
			await feedbackService.toggleVote(feedbackId, hasVoted);
			await loadFeedback();
		} catch (error) {
			console.error('[FeedbackPage] Error voting:', error);
		}
	}

	function setActiveTab(tab: 'my' | 'community') {
		activeTab = tab;
	}
</script>

<svelte:head>
	<title>{pageTitle} - {appName}</title>
</svelte:head>

<div class="feedback-page">
	<div class="feedback-page__container">
		<!-- Header -->
		<div class="feedback-page__header">
			<div class="feedback-page__icon">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
			</div>
			<h1 class="feedback-page__title">{pageTitle}</h1>
			<p class="feedback-page__subtitle">{pageSubtitle}</p>
		</div>

		<!-- Success Message -->
		{#if successMessage}
			<div class="feedback-page__success">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
				{successMessage}
			</div>
		{/if}

		<!-- New Feedback Button / Form -->
		<div class="feedback-page__form-section">
			{#if showForm}
				<div class="feedback-page__form-card">
					<h2 class="feedback-page__form-title">Neues Feedback</h2>
					<FeedbackForm
						onSubmit={handleSubmit}
						onCancel={() => (showForm = false)}
						{isSubmitting}
					/>
				</div>
			{:else}
				<button class="feedback-page__new-button" onclick={() => (showForm = true)}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					Feedback geben
				</button>
			{/if}
		</div>

		<!-- Tabs -->
		<div class="feedback-page__tabs">
			<button
				class="feedback-page__tab"
				class:feedback-page__tab--active={activeTab === 'community'}
				onclick={() => setActiveTab('community')}
			>
				{communityLabel}
				<span class="feedback-page__tab-count">{publicFeedback.length}</span>
			</button>
			<button
				class="feedback-page__tab"
				class:feedback-page__tab--active={activeTab === 'my'}
				onclick={() => setActiveTab('my')}
			>
				{myFeedbackLabel}
				<span class="feedback-page__tab-count">{myFeedback.length}</span>
			</button>
		</div>

		<!-- Content -->
		<div class="feedback-page__content">
			{#if isLoading}
				<div class="feedback-page__loading">
					<div class="feedback-page__spinner"></div>
					<p>Lade Feedback...</p>
				</div>
			{:else if activeTab === 'community'}
				<FeedbackList
					items={publicFeedback}
					{currentUserId}
					onVote={handleVote}
					emptyMessage={communityEmptyMessage}
				/>
			{:else}
				<FeedbackList
					items={myFeedback}
					{currentUserId}
					onVote={handleVote}
					votingDisabled={true}
					emptyMessage={myFeedbackEmptyMessage}
				/>
			{/if}
		</div>
	</div>
</div>

<style>
	.feedback-page {
		min-height: 100%;
		padding: 1rem;
	}

	.feedback-page__container {
		max-width: 48rem;
		margin: 0 auto;
	}

	.feedback-page__header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.feedback-page__icon {
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
		background: hsl(var(--color-surface, 0 0% 100%));
		border: 1px solid hsl(var(--color-border, 0 0% 90%));
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		color: hsl(var(--color-primary, 47 95% 58%));
	}

	.feedback-page__icon svg {
		width: 2rem;
		height: 2rem;
	}

	.feedback-page__title {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: hsl(var(--color-foreground, 0 0% 17%));
	}

	.feedback-page__subtitle {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
	}

	.feedback-page__success {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-success, 145 63% 42%) / 0.1);
		color: hsl(var(--color-success, 145 63% 42%));
		font-size: 0.875rem;
		font-weight: 500;
	}

	.feedback-page__success svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.feedback-page__form-section {
		margin-bottom: 1.5rem;
	}

	.feedback-page__new-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 1rem;
		border: 2px dashed hsl(var(--color-border, 0 0% 90%));
		border-radius: 0.75rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.feedback-page__new-button:hover {
		border-color: hsl(var(--color-primary, 47 95% 58%));
		color: hsl(var(--color-primary, 47 95% 58%));
		background: hsl(var(--color-primary, 47 95% 58%) / 0.05);
	}

	.feedback-page__new-button svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.feedback-page__form-card {
		padding: 1.5rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-surface, 0 0% 100%));
		border: 1px solid hsl(var(--color-border, 0 0% 90%));
	}

	.feedback-page__form-title {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground, 0 0% 17%));
	}

	.feedback-page__tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding: 0.25rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted, 0 0% 90%));
	}

	.feedback-page__tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.feedback-page__tab:hover {
		color: hsl(var(--color-foreground, 0 0% 17%));
	}

	.feedback-page__tab--active {
		background: hsl(var(--color-surface, 0 0% 100%));
		color: hsl(var(--color-foreground, 0 0% 17%));
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.feedback-page__tab-count {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		background: hsl(var(--color-muted, 0 0% 90%));
	}

	.feedback-page__tab--active .feedback-page__tab-count {
		background: hsl(var(--color-primary, 47 95% 58%) / 0.1);
		color: hsl(var(--color-primary, 47 95% 58%));
	}

	.feedback-page__content {
		min-height: 200px;
	}

	.feedback-page__loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem;
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
	}

	.feedback-page__spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid hsl(var(--color-border, 0 0% 90%));
		border-top-color: hsl(var(--color-primary, 47 95% 58%));
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
