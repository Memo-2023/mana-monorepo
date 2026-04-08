<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	let showWarning = $state(false);
	let secondsLeft = $state(0);
	let interval: ReturnType<typeof setInterval> | undefined;

	// Check token expiry every 30 seconds
	onMount(() => {
		interval = setInterval(checkSession, 30000);
		return () => {
			if (interval) clearInterval(interval);
		};
	});

	function checkSession() {
		if (!authStore.isAuthenticated) return;

		// Try to get token expiry from JWT
		const token = authStore.getAccessTokenSync?.();
		if (!token) return;

		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			const exp = payload.exp * 1000;
			const remaining = exp - Date.now();

			if (remaining < 5 * 60 * 1000 && remaining > 0) {
				// Less than 5 minutes remaining
				secondsLeft = Math.ceil(remaining / 1000);
				showWarning = true;
			} else {
				showWarning = false;
			}
		} catch {
			// Can't parse token, ignore
		}
	}

	async function handleRefresh() {
		try {
			await authStore.refreshToken?.();
			showWarning = false;
		} catch {
			// Refresh failed, user will be logged out
		}
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

{#if showWarning}
	<div class="session-warning" role="alert">
		<span class="warning-text">
			Sitzung lauft in {formatTime(secondsLeft)} ab
		</span>
		<button type="button" class="refresh-btn" onclick={handleRefresh}> Sitzung verlangern </button>
	</div>
{/if}

<style>
	/* Positioning is the parent's job — this lives inside .bottom-stack
	   in (app)/+layout.svelte. Used to be position: fixed at bottom 16px
	   with z-index 45, which the bottom-stack (z-index 90) hid. */
	.session-warning {
		display: flex;
		align-items: center;
		gap: 12px;
		background: rgba(245, 158, 11, 0.95);
		color: #1e293b;
		padding: 10px 20px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 500;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.warning-text {
		white-space: nowrap;
	}

	.refresh-btn {
		background: rgba(0, 0, 0, 0.15);
		border: none;
		color: #1e293b;
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.refresh-btn:hover {
		background: rgba(0, 0, 0, 0.25);
	}
</style>
