<script lang="ts">
	import {
		listDomains,
		addDomain,
		verifyDomain,
		removeDomain,
		DomainError,
		type CustomDomain,
	} from '../domains';

	interface Props {
		siteId: string;
	}

	let { siteId }: Props = $props();

	let domains = $state<CustomDomain[] | null>(null);
	let loadError = $state<string | null>(null);

	let newHost = $state('');
	let adding = $state(false);
	let addError = $state<string | null>(null);

	let verifyingId = $state<string | null>(null);

	async function load() {
		loadError = null;
		try {
			domains = await listDomains(siteId);
		} catch (err) {
			loadError =
				err instanceof DomainError ? err.message : err instanceof Error ? err.message : String(err);
		}
	}

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		siteId;
		void load();
	});

	async function onAdd() {
		const host = newHost.trim().toLowerCase();
		if (!host) {
			addError = 'Hostname erforderlich';
			return;
		}
		adding = true;
		addError = null;
		try {
			await addDomain(siteId, host);
			newHost = '';
			await load();
		} catch (err) {
			addError =
				err instanceof DomainError ? err.message : err instanceof Error ? err.message : String(err);
		} finally {
			adding = false;
		}
	}

	async function onVerify(domainId: string) {
		verifyingId = domainId;
		try {
			await verifyDomain(siteId, domainId);
			await load();
		} finally {
			verifyingId = null;
		}
	}

	async function onRemove(domainId: string, hostname: string) {
		if (!confirm(`Domain "${hostname}" entfernen?`)) return;
		await removeDomain(siteId, domainId);
		await load();
	}

	function copyToClipboard(v: string) {
		void navigator.clipboard?.writeText(v);
	}
</script>

<section class="wb-domains" aria-labelledby="wb-domains-title">
	<header>
		<h3 id="wb-domains-title">Eigene Domain</h3>
		<p class="wb-domains__hint">
			Verbinde einen eigenen Hostnamen (z.B. <code>meineseite.de</code>) mit dieser Website. Nur für
			Founder-Tier.
		</p>
	</header>

	{#if loadError}
		<p class="wb-error">{loadError}</p>
	{/if}

	<form
		class="wb-domains__add"
		onsubmit={(e) => {
			e.preventDefault();
			void onAdd();
		}}
	>
		<input
			type="text"
			placeholder="z.B. portfolio.deinedomain.de"
			value={newHost}
			oninput={(e) => (newHost = e.currentTarget.value)}
		/>
		<button class="wb-btn wb-btn--primary" disabled={adding || !newHost.trim()}>
			{adding ? 'Füge hinzu…' : '+ Domain'}
		</button>
	</form>

	{#if addError}
		<p class="wb-error">{addError}</p>
	{/if}

	{#if domains === null}
		<p class="wb-domains__empty">Lade…</p>
	{:else if domains.length === 0}
		<p class="wb-domains__empty">Noch keine eigenen Domains verbunden.</p>
	{:else}
		<ul class="wb-domains__list">
			{#each domains as d (d.id)}
				<li class="wb-domain">
					<div class="wb-domain__head">
						<div>
							<span class="wb-domain__host">{d.hostname}</span>
							<span class="wb-pill wb-pill--{d.status}">{d.status}</span>
						</div>
						<div class="wb-domain__actions">
							{#if d.status !== 'verified'}
								<button
									class="wb-btn wb-btn--primary"
									onclick={() => onVerify(d.id)}
									disabled={verifyingId === d.id}
								>
									{verifyingId === d.id ? 'Prüfe…' : 'Verify'}
								</button>
							{/if}
							<button
								class="wb-btn wb-btn--icon wb-btn--danger"
								onclick={() => onRemove(d.id, d.hostname)}
								title="Entfernen">×</button
							>
						</div>
					</div>

					{#if d.errorMessage}
						<p class="wb-domain__err">{d.errorMessage}</p>
					{/if}

					{#if d.status !== 'verified'}
						<div class="wb-domain__dns">
							<p class="wb-domain__dns-title">DNS konfigurieren:</p>
							<div class="wb-dns-row">
								<div>
									<span class="wb-dns-type">CNAME</span>
									<span class="wb-dns-name">{d.hostname}</span>
								</div>
								<button class="wb-dns-val" onclick={() => copyToClipboard(d.dnsTarget)}>
									{d.dnsTarget}
									<small>Klick zum Kopieren</small>
								</button>
							</div>
							<div class="wb-dns-row">
								<div>
									<span class="wb-dns-type">TXT</span>
									<span class="wb-dns-name">_mana-challenge.{d.hostname}</span>
								</div>
								<button class="wb-dns-val" onclick={() => copyToClipboard(d.verificationToken)}>
									{d.verificationToken}
									<small>Klick zum Kopieren</small>
								</button>
							</div>
							<p class="wb-domain__dns-note">
								DNS-Änderungen brauchen meist 5–30 Minuten, bis sie weltweit propagiert sind. Danach
								"Verify" klicken.
							</p>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.wb-domains {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.75rem;
	}
	.wb-domains header h3 {
		margin: 0;
		font-size: 0.9375rem;
	}
	.wb-domains__hint {
		margin: 0.2rem 0 0;
		font-size: 0.8125rem;
		opacity: 0.6;
	}
	.wb-domains__hint code {
		background: rgba(255, 255, 255, 0.06);
		padding: 0.05rem 0.25rem;
		border-radius: 0.25rem;
	}
	.wb-domains__empty {
		margin: 0;
		padding: 0.75rem;
		opacity: 0.5;
		font-style: italic;
		font-size: 0.8125rem;
	}

	.wb-domains__add {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
	}
	.wb-domains__add input {
		padding: 0.5rem 0.65rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-size: 0.875rem;
	}

	.wb-domains__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-domain {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.65rem 0.8rem;
		background: rgba(0, 0, 0, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
	}
	.wb-domain__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.wb-domain__host {
		font-family: ui-monospace, monospace;
		font-size: 0.875rem;
		margin-right: 0.5rem;
	}
	.wb-domain__actions {
		display: flex;
		gap: 0.35rem;
		align-items: center;
	}
	.wb-domain__err {
		margin: 0;
		padding: 0.35rem 0.5rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.25);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		color: rgb(248, 113, 113);
	}
	.wb-domain__dns {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.wb-domain__dns-title {
		margin: 0;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.55;
	}
	.wb-domain__dns-note {
		margin: 0.25rem 0 0;
		font-size: 0.7rem;
		opacity: 0.55;
		line-height: 1.4;
	}
	.wb-dns-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		align-items: start;
	}
	.wb-dns-type {
		display: inline-block;
		padding: 0.05rem 0.4rem;
		background: rgba(99, 102, 241, 0.2);
		border-radius: 0.25rem;
		font-size: 0.65rem;
		font-weight: 500;
		margin-right: 0.4rem;
	}
	.wb-dns-name {
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		opacity: 0.85;
	}
	.wb-dns-val {
		display: block;
		text-align: left;
		background: rgba(255, 255, 255, 0.03);
		border: 1px dashed rgba(255, 255, 255, 0.15);
		color: inherit;
		padding: 0.35rem 0.5rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		word-break: break-all;
	}
	.wb-dns-val:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.wb-dns-val small {
		display: block;
		opacity: 0.4;
		font-family: system-ui, sans-serif;
		font-size: 0.65rem;
		margin-top: 0.1rem;
	}

	.wb-pill {
		font-size: 0.7rem;
		padding: 0.12rem 0.5rem;
		border-radius: 9999px;
	}
	.wb-pill--pending {
		background: rgba(148, 163, 184, 0.2);
		color: rgb(203, 213, 225);
	}
	.wb-pill--verifying {
		background: rgba(59, 130, 246, 0.2);
		color: rgb(147, 197, 253);
	}
	.wb-pill--verified {
		background: rgba(16, 185, 129, 0.2);
		color: rgb(110, 231, 183);
	}
	.wb-pill--failed {
		background: rgba(248, 113, 113, 0.2);
		color: rgb(252, 165, 165);
	}

	.wb-btn {
		padding: 0.4rem 0.75rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.9);
		color: white;
	}
	.wb-btn--icon {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: inherit;
		width: 1.75rem;
		padding: 0;
		line-height: 1;
	}
	.wb-btn--danger:hover {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.4);
		color: rgb(248, 113, 113);
	}
	.wb-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.wb-error {
		margin: 0;
		padding: 0.4rem 0.55rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		color: rgb(248, 113, 113);
	}
</style>
