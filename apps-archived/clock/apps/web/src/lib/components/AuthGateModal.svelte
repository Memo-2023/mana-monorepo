<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	type Props = {
		open: boolean;
		action?: 'save' | 'sync' | 'feature';
		itemCount?: number;
		onClose: () => void;
	};

	let { open, action = 'save', itemCount = 0, onClose }: Props = $props();

	// Messages based on action type
	const messages = {
		save: {
			title: 'Daten speichern',
			description: 'Melde dich an, um deine Wecker und Timer dauerhaft in der Cloud zu speichern.',
		},
		sync: {
			title: 'Daten synchronisieren',
			description: 'Melde dich an, um deine Wecker und Timer auf allen Geräten zu synchronisieren.',
		},
		feature: {
			title: 'Funktion freischalten',
			description: 'Diese Funktion ist nur für angemeldete Benutzer verfügbar.',
		},
	};

	const currentMessage = $derived(messages[action] || messages.save);

	function handleLogin() {
		if (browser) {
			sessionStorage.setItem('auth-return-url', window.location.pathname);
		}
		goto('/login');
	}

	function handleRegister() {
		if (browser) {
			sessionStorage.setItem('auth-return-url', window.location.pathname);
		}
		goto('/register');
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onClose}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>{currentMessage.title}</h2>
				<button class="close-btn" onclick={onClose} aria-label="Schliessen">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<p>{currentMessage.description}</p>

				{#if itemCount > 0}
					<div class="migration-info">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="16" x2="12" y2="12"></line>
							<line x1="12" y1="8" x2="12.01" y2="8"></line>
						</svg>
						<span
							>Du hast {itemCount}
							{itemCount === 1 ? 'Element' : 'Elemente'} in deiner Session. Diese werden nach der Anmeldung
							in deinen Account übertragen.</span
						>
					</div>
				{/if}
			</div>

			<div class="modal-actions">
				<button class="btn btn-secondary" onclick={onClose}> Später </button>
				<button class="btn btn-primary" onclick={handleLogin}> Anmelden </button>
				<button class="btn btn-outline" onclick={handleRegister}> Registrieren </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal-content {
		background-color: var(--color-surface-elevated-2);
		border: 1px solid var(--color-border-strong);
		border-radius: 0.75rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		max-width: 28rem;
		width: 100%;
		padding: 1.5rem;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground, #1f2937);
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		color: var(--color-muted-foreground, #6b7280);
		border-radius: 0.375rem;
		transition: color 0.15s;
	}

	.close-btn:hover {
		color: var(--color-foreground, #1f2937);
	}

	.modal-body {
		margin-bottom: 1.5rem;
	}

	.modal-body p {
		color: var(--color-muted-foreground, #6b7280);
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.migration-info {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: var(--color-primary-50, #fef3c7);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-primary-700, #b45309);
	}

	.migration-info svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.625rem 1rem;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
		border: 1px solid transparent;
	}

	.btn-primary {
		background-color: var(--color-primary, #f59e0b);
		color: white;
		flex: 1;
	}

	.btn-primary:hover {
		background-color: var(--color-primary-600, #d97706);
	}

	.btn-secondary {
		background-color: var(--color-muted, #f3f4f6);
		color: var(--color-muted-foreground, #6b7280);
	}

	.btn-secondary:hover {
		background-color: var(--color-muted-200, #e5e7eb);
	}

	.btn-outline {
		background-color: transparent;
		border-color: var(--color-border, #e5e7eb);
		color: var(--color-foreground, #1f2937);
	}

	.btn-outline:hover {
		background-color: var(--color-muted, #f3f4f6);
	}
</style>
