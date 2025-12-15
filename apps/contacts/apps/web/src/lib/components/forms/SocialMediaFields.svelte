<script lang="ts">
	interface Props {
		linkedin: string;
		twitter: string;
		facebook: string;
		instagram: string;
		xing: string;
		github: string;
		youtube: string;
		tiktok: string;
		telegram: string;
		whatsapp: string;
		signal: string;
		discord: string;
		bluesky: string;
		initiallyOpen?: boolean;
	}

	let {
		linkedin = $bindable(''),
		twitter = $bindable(''),
		facebook = $bindable(''),
		instagram = $bindable(''),
		xing = $bindable(''),
		github = $bindable(''),
		youtube = $bindable(''),
		tiktok = $bindable(''),
		telegram = $bindable(''),
		whatsapp = $bindable(''),
		signal = $bindable(''),
		discord = $bindable(''),
		bluesky = $bindable(''),
		initiallyOpen = false,
	}: Props = $props();

	let isOpen = $state(initiallyOpen);

	// Auto-open if any field has data
	$effect(() => {
		if (
			linkedin ||
			twitter ||
			facebook ||
			instagram ||
			xing ||
			github ||
			youtube ||
			tiktok ||
			telegram ||
			whatsapp ||
			signal ||
			discord ||
			bluesky
		) {
			isOpen = true;
		}
	});
</script>

<section class="form-section">
	<button
		type="button"
		class="section-header section-header-toggle"
		onclick={() => (isOpen = !isOpen)}
	>
		<div class="section-icon">
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
				/>
			</svg>
		</div>
		<h2 class="section-title">Social Media</h2>
		<svg
			class="chevron-icon"
			class:chevron-open={isOpen}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
	{#if isOpen}
		<div class="social-grid">
			<div class="form-field">
				<label for="linkedin" class="label social-label">
					<span class="social-icon-label">in</span>
					LinkedIn
				</label>
				<input
					id="linkedin"
					type="url"
					bind:value={linkedin}
					class="input"
					placeholder="https://linkedin.com/in/..."
				/>
			</div>
			<div class="form-field">
				<label for="twitter" class="label social-label">
					<span class="social-icon-label">X</span>
					Twitter / X
				</label>
				<input
					id="twitter"
					type="text"
					bind:value={twitter}
					class="input"
					placeholder="@username"
				/>
			</div>
			<div class="form-field">
				<label for="facebook" class="label social-label">
					<span class="social-icon-label">f</span>
					Facebook
				</label>
				<input
					id="facebook"
					type="url"
					bind:value={facebook}
					class="input"
					placeholder="https://facebook.com/..."
				/>
			</div>
			<div class="form-field">
				<label for="instagram" class="label social-label">
					<span class="social-icon-label">ig</span>
					Instagram
				</label>
				<input
					id="instagram"
					type="text"
					bind:value={instagram}
					class="input"
					placeholder="@username"
				/>
			</div>
			<div class="form-field">
				<label for="xing" class="label social-label">
					<span class="social-icon-label">xi</span>
					Xing
				</label>
				<input
					id="xing"
					type="url"
					bind:value={xing}
					class="input"
					placeholder="https://xing.com/profile/..."
				/>
			</div>
			<div class="form-field">
				<label for="github" class="label social-label">
					<span class="social-icon-label">gh</span>
					GitHub
				</label>
				<input id="github" type="text" bind:value={github} class="input" placeholder="username" />
			</div>
			<div class="form-field">
				<label for="youtube" class="label social-label">
					<span class="social-icon-label">yt</span>
					YouTube
				</label>
				<input
					id="youtube"
					type="url"
					bind:value={youtube}
					class="input"
					placeholder="https://youtube.com/@..."
				/>
			</div>
			<div class="form-field">
				<label for="tiktok" class="label social-label">
					<span class="social-icon-label">tt</span>
					TikTok
				</label>
				<input id="tiktok" type="text" bind:value={tiktok} class="input" placeholder="@username" />
			</div>
			<div class="form-field">
				<label for="telegram" class="label social-label">
					<span class="social-icon-label">tg</span>
					Telegram
				</label>
				<input
					id="telegram"
					type="text"
					bind:value={telegram}
					class="input"
					placeholder="@username"
				/>
			</div>
			<div class="form-field">
				<label for="whatsapp" class="label social-label">
					<span class="social-icon-label">wa</span>
					WhatsApp
				</label>
				<input id="whatsapp" type="tel" bind:value={whatsapp} class="input" placeholder="+49..." />
			</div>
			<div class="form-field">
				<label for="signal" class="label social-label">
					<span class="social-icon-label">sg</span>
					Signal
				</label>
				<input id="signal" type="tel" bind:value={signal} class="input" placeholder="+49..." />
			</div>
			<div class="form-field">
				<label for="discord" class="label social-label">
					<span class="social-icon-label">dc</span>
					Discord
				</label>
				<input
					id="discord"
					type="text"
					bind:value={discord}
					class="input"
					placeholder="username#1234"
				/>
			</div>
			<div class="form-field">
				<label for="bluesky" class="label social-label">
					<span class="social-icon-label">bs</span>
					Bluesky
				</label>
				<input
					id="bluesky"
					type="text"
					bind:value={bluesky}
					class="input"
					placeholder="@handle.bsky.social"
				/>
			</div>
		</div>
	{/if}
</section>

<style>
	.form-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.25rem;
	}

	.section-header-toggle {
		cursor: pointer;
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		padding: 0;
		border-bottom: none;
		margin-bottom: 0;
	}

	.section-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.section-icon svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.section-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		flex: 1;
	}

	.chevron-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.chevron-open {
		transform: rotate(180deg);
	}

	.social-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (max-width: 480px) {
		.social-grid {
			grid-template-columns: 1fr;
		}
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.social-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.social-icon-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: lowercase;
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.6);
	}
</style>
