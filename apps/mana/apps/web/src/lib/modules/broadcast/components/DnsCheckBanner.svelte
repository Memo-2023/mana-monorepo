<!--
  DnsCheckBanner — SPF / DKIM / DMARC status for the user's sending
  domain with copy-paste records + "jetzt prüfen" trigger.

  Derives the domain from the sender email (after the @). Calls
  mana-mail's /v1/mail/dns-check on demand; caches the last result
  in the settings row so the banner survives a reload.

  The DNS check takes 2–3 seconds (DoH round-trips to 1.1.1.1); we
  show a spinner so the user doesn't double-click.
-->
<script lang="ts">
	import { runDnsCheck, type DnsCheckResult } from '../api';
	import { broadcastSettingsStore } from '../stores/settings.svelte';
	import type { BroadcastSettings } from '../types';

	interface Props {
		settings: BroadcastSettings;
	}

	let { settings }: Props = $props();

	let result = $state<DnsCheckResult | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const domain = $derived.by(() => {
		const email = settings.defaultFromEmail ?? '';
		const at = email.indexOf('@');
		return at >= 0 ? email.slice(at + 1).trim() : '';
	});

	async function runCheck() {
		if (!domain) {
			error = 'Keine Absender-Domain — setze zuerst die Absender-E-Mail.';
			return;
		}
		loading = true;
		error = null;
		try {
			result = await runDnsCheck(domain);
			// Persist a compact snapshot to the settings row so the banner
			// shows the last result on next mount without re-hitting the API.
			await broadcastSettingsStore.update({
				dnsCheck: {
					domain,
					spf: result.spf.status,
					dkim: result.dkim.status,
					dmarc: result.dmarc.status,
					checkedAt: result.checkedAt,
				},
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'DNS-Check fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function statusIcon(status: 'ok' | 'missing' | 'wrong' | 'weak'): string {
		return { ok: '✓', weak: '⚠', wrong: '✕', missing: '—' }[status];
	}

	function statusClass(status: 'ok' | 'missing' | 'wrong' | 'weak'): string {
		return `status-${status}`;
	}
</script>

<section class="dns-card">
	<header class="dns-head">
		<div>
			<h3>DNS-Authentifizierung</h3>
			<p class="hint">
				SPF / DKIM / DMARC auf <strong>{domain || '—'}</strong> — ohne das landen Newsletter überdurchschnittlich
				oft im Spam.
			</p>
		</div>
		<button type="button" class="btn-check" onclick={runCheck} disabled={loading || !domain}>
			{loading ? 'Prüft …' : 'Jetzt prüfen'}
		</button>
	</header>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if result}
		<ul class="checks">
			<li class={statusClass(result.spf.status)}>
				<span class="icon">{statusIcon(result.spf.status)}</span>
				<span class="check-label">SPF</span>
				<span class="check-message">{result.spf.message}</span>
			</li>
			<li class={statusClass(result.dkim.status)}>
				<span class="icon">{statusIcon(result.dkim.status)}</span>
				<span class="check-label">DKIM ({result.dkim.selector})</span>
				<span class="check-message">{result.dkim.message}</span>
			</li>
			<li class={statusClass(result.dmarc.status)}>
				<span class="icon">{statusIcon(result.dmarc.status)}</span>
				<span class="check-label">DMARC</span>
				<span class="check-message">{result.dmarc.message}</span>
			</li>
		</ul>

		{#if result.spf.status !== 'ok' || result.dmarc.status === 'missing'}
			<details class="suggested">
				<summary>Empfohlene DNS-Records (zum Kopieren)</summary>
				<p class="hint">
					Bei deinem Domain-Registrar (z. B. Cloudflare / Infomaniak) als TXT-Records anlegen.
				</p>
				{#if result.spf.status !== 'ok'}
					<div class="record">
						<div class="record-header">
							<code class="record-type">TXT auf <strong>{result.domain}</strong></code>
							<button
								type="button"
								class="btn-copy"
								onclick={() => copyToClipboard(result!.suggested.spfAdd)}
							>
								Kopieren
							</button>
						</div>
						<pre><code>{result.suggested.spfAdd}</code></pre>
					</div>
				{/if}
				{#if result.dmarc.status === 'missing'}
					<div class="record">
						<div class="record-header">
							<code class="record-type">
								TXT auf <strong>_dmarc.{result.domain}</strong>
							</code>
							<button
								type="button"
								class="btn-copy"
								onclick={() => copyToClipboard(result!.suggested.dmarcRecord)}
							>
								Kopieren
							</button>
						</div>
						<pre><code>{result.suggested.dmarcRecord}</code></pre>
					</div>
				{/if}
				{#if result.dkim.status === 'missing'}
					<p class="hint">
						DKIM-Setup ist provider-spezifisch — wende dich an den Mana-Support oder schau in der
						Stalwart-Doku, wie der DKIM-Key für
						<code>{result.dkim.selector}._domainkey.{result.domain}</code>
						aussehen soll.
					</p>
				{/if}
			</details>
		{/if}

		<p class="footer-hint">
			Letzte Prüfung: {new Date(result.checkedAt).toLocaleString()}
		</p>
	{:else if settings.dnsCheck}
		<p class="hint">
			Letzte Prüfung: {new Date(settings.dnsCheck.checkedAt).toLocaleString()}
			<br />
			SPF {statusIcon(settings.dnsCheck.spf)} · DKIM {statusIcon(settings.dnsCheck.dkim)} · DMARC {statusIcon(
				settings.dnsCheck.dmarc
			)}
		</p>
	{/if}
</section>

<style>
	.dns-card {
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.dns-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.dns-head h3 {
		margin: 0 0 0.25rem;
		font-size: 1rem;
		font-weight: 600;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.btn-check {
		padding: 0.45rem 1rem;
		background: #6366f1;
		color: white;
		border: 0;
		border-radius: 0.4rem;
		cursor: pointer;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.btn-check:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.6rem 0.85rem;
		border-radius: 0.4rem;
		font-size: 0.85rem;
	}

	.checks {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.checks li {
		display: grid;
		grid-template-columns: 1.5rem 5rem 1fr;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.4rem;
		font-size: 0.9rem;
	}

	.checks li.status-ok {
		background: #dcfce7;
		color: #15803d;
	}

	.checks li.status-weak {
		background: #fef3c7;
		color: #92400e;
	}

	.checks li.status-wrong,
	.checks li.status-missing {
		background: #fef2f2;
		color: #991b1b;
	}

	.icon {
		font-weight: 600;
		text-align: center;
	}

	.check-label {
		font-weight: 500;
	}

	.check-message {
		color: inherit;
		opacity: 0.85;
		font-size: 0.85rem;
	}

	.suggested {
		background: var(--color-surface-muted, #f8fafc);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.4rem;
		padding: 0.75rem 1rem;
	}

	.suggested summary {
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.suggested[open] summary {
		margin-bottom: 0.5rem;
	}

	.record {
		margin-top: 0.75rem;
	}

	.record-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.record-type {
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}

	.record pre {
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.35rem;
		padding: 0.6rem 0.75rem;
		font-size: 0.85rem;
		overflow-x: auto;
		margin: 0;
	}

	.btn-copy {
		padding: 0.25rem 0.65rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.3rem;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.btn-copy:hover {
		background: #eef2ff;
		border-color: #6366f1;
	}

	.footer-hint {
		margin: 0.25rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted, #94a3b8);
		text-align: right;
	}

	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}
</style>
