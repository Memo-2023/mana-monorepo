<!--
  CommunitySection — Identity opt-ins für den Public-Community-Hub.
  Aktuell:
    - Avatar-Preview + Pseudonym-Anzeige
    - Karma + Tier-Badge
    - Klarname-Toggle (community_show_real_name)
  Zukünftig könnten hier Pseudonym-Reset, Notification-Präferenzen, etc.
  landen.
-->
<script lang="ts">
	import { EulenAvatar, KARMA_TIER_CONFIG, tierFromKarma } from '@mana/feedback';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { browser } from '$app/environment';
	import { Megaphone } from '@mana/shared-icons';

	function getAuthUrl(): string {
		if (browser && typeof window !== 'undefined') {
			const injected = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
				.__PUBLIC_MANA_AUTH_URL__;
			if (injected) return injected;
		}
		return import.meta.env.DEV ? 'http://localhost:3001' : '';
	}

	type ProfileBlob = {
		displayHash?: string;
		displayName?: string;
		communityShowRealName?: boolean;
		communityKarma?: number;
	};

	let profile = $state<ProfileBlob>({});
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const token = await authStore.getValidToken();
			if (!token) throw new Error('not authenticated');
			// We don't have a "get my community profile" endpoint yet — but the
			// my-feedback endpoint is enough to derive everything we need:
			// most-recent post carries the displayHash + displayName, the
			// auth.users karma comes back via /me/data.
			const [profileRes, dataRes] = await Promise.all([
				fetch(`${getAuthUrl()}/api/v1/me/data`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
				fetch(`${getAuthUrl()}/api/v1/me/profile`, {
					headers: { Authorization: `Bearer ${token}` },
				}).catch(() => null),
			]);
			if (!profileRes.ok) throw new Error(`profile load ${profileRes.status}`);
			const data = (await profileRes.json()) as {
				auth?: {
					communityShowRealName?: boolean;
					communityKarma?: number;
				};
			};
			profile = {
				...profile,
				communityShowRealName: data.auth?.communityShowRealName ?? false,
				communityKarma: data.auth?.communityKarma ?? 0,
			};
			if (dataRes && dataRes.ok) {
				const fields = (await dataRes.json()) as ProfileBlob;
				profile = { ...profile, ...fields };
			}
		} catch (err) {
			console.warn('[community-section] load failed:', err);
			error = err instanceof Error ? err.message : 'Konnte die Community-Daten nicht laden';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void load();
	});

	async function toggleRealName(next: boolean) {
		if (saving) return;
		saving = true;
		const previous = profile.communityShowRealName;
		profile = { ...profile, communityShowRealName: next }; // optimistic
		try {
			const token = await authStore.getValidToken();
			const res = await fetch(`${getAuthUrl()}/api/v1/me/profile`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ communityShowRealName: next }),
			});
			if (!res.ok) throw new Error(`update ${res.status}`);
		} catch (err) {
			console.warn('[community-section] toggle failed:', err);
			error = 'Speichern fehlgeschlagen — versuch es nochmal.';
			profile = { ...profile, communityShowRealName: previous }; // rollback
		} finally {
			saving = false;
		}
	}

	let karma = $derived(profile.communityKarma ?? 0);
	let tier = $derived(tierFromKarma(karma));
	let tierCfg = $derived(KARMA_TIER_CONFIG[tier]);
</script>

<SettingsPanel id="community-identity">
	<SettingsSectionHeader
		icon={Megaphone}
		title="Community-Identität"
		description="Wie du in der Mana-Community auftauchst — Pseudonym, Karma, Klarname-Toggle."
	/>

	{#if loading}
		<div class="state">Lade…</div>
	{:else}
		<div class="profile-card">
			<EulenAvatar
				displayHash={profile.displayHash ?? null}
				size={56}
				title={profile.displayName ?? ''}
			/>
			<div class="profile-info">
				<div class="display-name">
					<span class="tier-dot" style:background-color={tierCfg.color}></span>
					<strong>{profile.displayName ?? 'Wachsame Eule (noch unbenutzt)'}</strong>
					{#if authStore.user?.name && profile.communityShowRealName}
						<span class="real-name">· {authStore.user.name}</span>
					{/if}
				</div>
				<div class="karma-row">
					<span
						class="tier-pill"
						style:background-color="{tierCfg.color}22"
						style:color={tierCfg.color}
					>
						{tierCfg.label}-Eule
					</span>
					<span class="karma">{karma} Karma</span>
				</div>
				<p class="hint">
					Dein Pseudonym ist deterministisch aus deiner User-ID abgeleitet — es bleibt dasselbe,
					solange du derselbe Account bist. Niemand außer dem Mana-Team kann es zurückführen.
				</p>
			</div>
		</div>

		<div class="toggle-row">
			<div>
				<div class="toggle-label">Klarnamen neben dem Pseudonym zeigen</div>
				<div class="toggle-hint">
					Wenn aktiv, sehen eingeloggte Mana-User im Feedback-Feed deinen Namen ({authStore.user
						?.name ?? 'kein Name'}) neben deiner Eule. Auf der öffentlichen feedback.mana.how-Seite
					(ohne Login) wird der Klarname <strong>nie</strong> gezeigt.
				</div>
			</div>
			<button
				type="button"
				class="switch"
				class:on={profile.communityShowRealName}
				disabled={saving}
				role="switch"
				aria-label="Klarnamen neben Pseudonym zeigen"
				aria-checked={profile.communityShowRealName}
				onclick={() => toggleRealName(!profile.communityShowRealName)}
			>
				<span class="switch-thumb"></span>
			</button>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}
	{/if}
</SettingsPanel>

<style>
	.state {
		padding: 1.5rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	.profile-card {
		display: flex;
		gap: 0.875rem;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.25);
		border-radius: 0.75rem;
	}

	.profile-info {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		min-width: 0;
		flex: 1;
	}

	.display-name {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.9375rem;
	}

	.tier-dot {
		display: inline-block;
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		box-shadow: 0 0 0 1px hsl(0 0% 0% / 0.1);
	}

	.real-name {
		color: hsl(var(--color-muted-foreground));
		font-weight: 400;
	}

	.karma-row {
		display: flex;
		gap: 0.375rem;
		align-items: center;
		font-size: 0.75rem;
	}

	.tier-pill {
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-weight: 700;
	}

	.karma {
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.hint {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.45;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
	}

	.toggle-label {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.toggle-hint {
		margin-top: 0.25rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.45;
	}

	.switch {
		flex-shrink: 0;
		width: 2.5rem;
		height: 1.5rem;
		border: none;
		border-radius: 999px;
		background: hsl(var(--color-muted) / 0.6);
		position: relative;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.switch.on {
		background: hsl(var(--color-primary));
	}

	.switch:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.switch-thumb {
		position: absolute;
		top: 0.125rem;
		left: 0.125rem;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: white;
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.18);
		transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.switch.on .switch-thumb {
		transform: translateX(1rem);
	}

	.error {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-error, 0 84% 60%));
	}
</style>
