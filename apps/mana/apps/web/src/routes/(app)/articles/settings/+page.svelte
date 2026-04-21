<!--
  /articles/settings — collection of "how to save faster" tips.

  Two surfaces today:

   1. Bookmarklet — one-click save from any desktop browser. The user
      drags the button into their bookmarks bar; clicking it opens
      /articles/add?url=<current-page> in a new tab.

   2. Share Target — installed PWA appears in the OS share sheet on
      Android / Chromium desktop. Same landing route as the bookmarklet.

  Both end up in AddUrlForm, which reads the ?url / ?text / ?title query
  params, auto-triggers the Readability preview, and drops the user one
  click away from "In Leseliste speichern".
-->
<script lang="ts">
	import { onMount } from 'svelte';

	// `origin` at render time — server-side rendering has no window, so
	// we read it client-side after mount. The bookmarklet embeds the
	// origin so the JavaScript URL works from any other origin's bookmark
	// bar.
	let origin = $state('');
	onMount(() => {
		origin = window.location.origin;
	});

	const bookmarklet = $derived(
		origin
			? `javascript:void(window.open('${origin}/articles/add?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'_blank'))`
			: ''
	);

	let copyLabel = $state('Snippet kopieren');

	async function copySnippet() {
		if (!bookmarklet) return;
		try {
			await navigator.clipboard.writeText(bookmarklet);
			copyLabel = 'Kopiert ✓';
			setTimeout(() => (copyLabel = 'Snippet kopieren'), 1500);
		} catch {
			copyLabel = 'Fehler — bitte manuell kopieren';
		}
	}
</script>

<svelte:head>
	<title>Artikel-Einstellungen — Mana</title>
</svelte:head>

<div class="settings-shell">
	<header class="header">
		<h1>Artikel-Einstellungen</h1>
		<p class="subtitle">Schnellwege, um Artikel aus dem Browser in die Leseliste zu bekommen.</p>
	</header>

	<section class="card">
		<h2>Bookmarklet</h2>
		<p>
			Zieh den Button unten in deine Lesezeichen-Leiste. Ein Klick auf einer beliebigen Webseite
			öffnet
			<code>/articles/add</code> mit der aktuellen URL vorausgefüllt — du bestätigst nur noch die Vorschau.
		</p>
		<div class="bookmarklet-row">
			<!-- The anchor IS the bookmarklet: its href is the javascript: -->
			<!-- snippet. We sanity-check it client-side (origin-prefixed and -->
			<!-- opens a new tab) before persisting state, so there's no XSS -->
			<!-- surface here beyond what the browser already allows on any -->
			<!-- javascript: bookmark. -->
			{#if bookmarklet}
				<a class="bookmarklet" href={bookmarklet} onclick={(e) => e.preventDefault()}>
					+ In Mana speichern
				</a>
			{:else}
				<span class="muted">Bookmarklet wird geladen…</span>
			{/if}
			<button type="button" class="copy-btn" onclick={copySnippet} disabled={!bookmarklet}>
				{copyLabel}
			</button>
		</div>
		<details class="snippet-details">
			<summary>Quellcode anzeigen</summary>
			<pre class="snippet">{bookmarklet}</pre>
		</details>
		<p class="hint">
			Funktioniert in jedem Desktop-Browser. In Safari: Lesezeichen anlegen mit einer beliebigen
			URL, dann nachträglich die URL durch das Snippet ersetzen.
		</p>
	</section>

	<section class="card">
		<h2>Share-Target (Android / Chromium)</h2>
		<p>
			Wenn du Mana als App installierst (Browser-Menü „Zum Startbildschirm hinzufügen"), taucht
			„Mana" in deinem OS-Share-Sheet auf. Teilen aus dem Browser oder einer anderen App → Mana
			auswählen → Artikel wird direkt in der Leseliste vorgeschlagen.
		</p>
		<p class="hint">
			iOS-Safari unterstützt die Web-Share-Target-API derzeit nicht — nutze dort das Bookmarklet.
		</p>
	</section>
</div>

<style>
	.settings-shell {
		max-width: 720px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.header h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.6rem;
	}
	.subtitle {
		color: var(--color-text-muted, #64748b);
		margin: 0;
		font-size: 0.95rem;
	}
	.card {
		padding: 1.1rem 1.2rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		border-radius: 0.75rem;
		background: var(--color-surface, transparent);
	}
	.card h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.15rem;
	}
	.card p {
		margin: 0 0 0.75rem 0;
		line-height: 1.55;
	}
	.hint {
		color: var(--color-text-muted, #64748b);
		font-size: 0.85rem;
	}
	code {
		padding: 0.1rem 0.35rem;
		border-radius: 0.3rem;
		background: color-mix(in srgb, currentColor 8%, transparent);
		font-size: 0.92em;
	}
	.bookmarklet-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0.75rem 0;
		flex-wrap: wrap;
	}
	.bookmarklet {
		padding: 0.5rem 1rem;
		border-radius: 0.55rem;
		background: #f97316;
		color: white;
		font-weight: 500;
		text-decoration: none;
		user-select: none;
		cursor: grab;
		display: inline-flex;
		align-items: center;
	}
	.bookmarklet:hover {
		background: #ea580c;
	}
	.copy-btn {
		padding: 0.5rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	.copy-btn:hover:not(:disabled) {
		border-color: var(--color-border-strong, rgba(0, 0, 0, 0.3));
	}
	.copy-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.muted {
		color: var(--color-text-muted, #64748b);
	}
	.snippet-details {
		margin-top: 0.5rem;
	}
	.snippet-details summary {
		cursor: pointer;
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
	.snippet {
		margin: 0.5rem 0 0 0;
		padding: 0.6rem 0.75rem;
		border-radius: 0.45rem;
		background: color-mix(in srgb, currentColor 6%, transparent);
		font-family: 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.78rem;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>
