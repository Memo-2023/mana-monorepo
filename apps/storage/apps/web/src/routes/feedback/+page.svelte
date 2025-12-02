<script lang="ts">
	import { MessageSquare, Send } from 'lucide-svelte';
	import { toast } from '$lib/stores/toast';

	let type = $state<'bug' | 'feature' | 'other'>('feature');
	let message = $state('');
	let sending = $state(false);

	async function handleSubmit() {
		if (!message.trim()) return;

		sending = true;

		// Simulate sending feedback
		await new Promise((resolve) => setTimeout(resolve, 1000));

		toast.success('Feedback gesendet! Vielen Dank.');
		message = '';
		type = 'feature';
		sending = false;
	}
</script>

<svelte:head>
	<title>Feedback - Storage</title>
</svelte:head>

<div class="feedback-page">
	<div class="page-header">
		<h1>
			<MessageSquare size={24} />
			Feedback
		</h1>
	</div>

	<div class="feedback-card">
		<p class="intro">
			Wir freuen uns über dein Feedback! Teile uns mit, was wir verbessern können oder welche
			Funktionen du dir wünschst.
		</p>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-group">
				<label>Art des Feedbacks</label>
				<div class="type-selector">
					<button
						type="button"
						class="type-btn"
						class:active={type === 'bug'}
						onclick={() => (type = 'bug')}
					>
						Bug melden
					</button>
					<button
						type="button"
						class="type-btn"
						class:active={type === 'feature'}
						onclick={() => (type = 'feature')}
					>
						Feature-Wunsch
					</button>
					<button
						type="button"
						class="type-btn"
						class:active={type === 'other'}
						onclick={() => (type = 'other')}
					>
						Sonstiges
					</button>
				</div>
			</div>

			<div class="form-group">
				<label for="message">Deine Nachricht</label>
				<textarea
					id="message"
					bind:value={message}
					placeholder="Beschreibe dein Feedback hier..."
					rows="6"
				></textarea>
			</div>

			<button type="submit" class="submit-btn" disabled={!message.trim() || sending}>
				<Send size={18} />
				{sending ? 'Wird gesendet...' : 'Feedback senden'}
			</button>
		</form>
	</div>
</div>

<style>
	.feedback-page {
		min-height: 100%;
		max-width: 600px;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.feedback-card {
		padding: 2rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-xl);
	}

	.intro {
		margin: 0 0 1.5rem;
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
		line-height: 1.6;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
	}

	.type-selector {
		display: flex;
		gap: 0.5rem;
	}

	.type-btn {
		flex: 1;
		padding: 0.625rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.type-btn:hover {
		border-color: rgb(var(--color-primary));
		color: rgb(var(--color-text-primary));
	}

	.type-btn.active {
		background: rgba(var(--color-primary), 0.1);
		border-color: rgb(var(--color-primary));
		color: rgb(var(--color-primary));
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
		resize: vertical;
		font-family: inherit;
	}

	textarea:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
		box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1);
	}

	textarea::placeholder {
		color: rgb(var(--color-text-tertiary));
	}

	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		background: rgb(var(--color-primary));
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.submit-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		.type-selector {
			flex-direction: column;
		}
	}
</style>
