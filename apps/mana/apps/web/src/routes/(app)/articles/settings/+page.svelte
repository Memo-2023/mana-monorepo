<!--
  /articles/settings — collection of "how to save faster" tips.

  Three surfaces today:

   1. Browser-HTML-Bookmarklet (v2) — recommended. Reads the rendered
      HTML from the user's browser tab + postMessages it to a new Mana
      tab which runs Readability on that HTML. Works on cookie-walled
      sites (Golem, Spiegel, Zeit, Heise) and soft paywalls because it
      uses the user's already-authenticated session.

   2. URL-Bookmarklet (v1) — legacy. Opens /articles/add?url=<page>,
      the server does an anonymous fetch. Fails on GDPR-walled sites
      (see AddUrlForm's "probable_consent_wall" warning). Kept because
      it's a single click for sites where it works, and cross-browser
      stable.

   3. Share-Target — installed PWA appears in the Android / Chromium
      share sheet. Uses the same URL path as v1.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	// `origin` at render time — server-side rendering has no window, so
	// we read it client-side after mount. The bookmarklets embed the
	// origin so the JavaScript URLs work from any other origin's
	// bookmark bar.
	let origin = $state('');
	onMount(() => {
		origin = window.location.origin;
	});

	// Bookmarklet v1 — quick path for sites without consent walls.
	// Single call: open new tab with ?url=<current page>; server fetches.
	const bookmarkletV1 = $derived(
		origin
			? `javascript:void(window.open('${origin}/articles/add?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'_blank'))`
			: ''
	);

	// Bookmarklet v2 — browser-HTML path. Reads the rendered DOM from
	// the user's current tab (with all cookies + consent applied), opens
	// /articles/add?source=bookmarklet in a new tab, and postMessages
	// the HTML over. The new tab's AddUrlForm is the authoritative
	// receiver: it POSTs the HTML to /api/v1/articles/extract/html over
	// its own same-origin authenticated channel. No cross-origin CORS,
	// no token sharing, no form-submission CSP issues. Includes a 15s
	// safety timeout in case the new tab never comes up.
	//
	// The snippet is intentionally compact — browsers truncate bookmark
	// URLs at different lengths (Chrome/Firefox handle ~64 KiB fine,
	// Safari is stricter) so readable JS compresses well here.
	const bookmarkletV2 = $derived(
		origin
			? `javascript:(()=>{var h=document.documentElement.outerHTML,u=location.href,t=document.title,w=window.open('${origin}/articles/add?source=bookmarklet','_blank'),d=0;if(!w){alert('Mana: Popup blockiert');return}var m=function(e){if(e.source!==w)return;if(e.data&&e.data.type==='mana-ready'){w.postMessage({type:'mana-html',url:u,html:h,title:t},'*');window.removeEventListener('message',m);d=1}};window.addEventListener('message',m);setTimeout(function(){if(!d){window.removeEventListener('message',m);alert('Mana antwortet nicht — Tab geöffnet?')}},15000)})()`
			: ''
	);

	let copyV1Label = $state('Snippet kopieren');
	let copyV2Label = $state('Snippet kopieren');

	async function copySnippet(value: string, which: 'v1' | 'v2') {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			if (which === 'v1') {
				copyV1Label = 'Kopiert ✓';
				setTimeout(() => (copyV1Label = 'Snippet kopieren'), 1500);
			} else {
				copyV2Label = 'Kopiert ✓';
				setTimeout(() => (copyV2Label = 'Snippet kopieren'), 1500);
			}
		} catch {
			if (which === 'v1') copyV1Label = 'Fehler — bitte manuell kopieren';
			else copyV2Label = 'Fehler — bitte manuell kopieren';
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

	<section class="card card-recommended">
		<div class="badge">Empfohlen</div>
		<h2>Browser-HTML-Bookmarklet</h2>
		<p>
			Dieses Bookmarklet nimmt den <strong>schon gerenderten HTML-Inhalt</strong> aus deinem Browser-Tab
			(inkl. aller Cookies, die du gesetzt hast) und schickt ihn an Mana. Damit klappen auch Seiten mit
			Cookie-Wänden (Golem, Spiegel, Zeit, Heise …) und weichen Paywalls.
		</p>
		<div class="bookmarklet-row">
			{#if bookmarkletV2}
				<a class="bookmarklet" href={bookmarkletV2} onclick={(e) => e.preventDefault()}>
					+ In Mana speichern (HTML)
				</a>
			{:else}
				<span class="muted">Bookmarklet wird geladen…</span>
			{/if}
			<button
				type="button"
				class="copy-btn"
				onclick={() => copySnippet(bookmarkletV2, 'v2')}
				disabled={!bookmarkletV2}
			>
				{copyV2Label}
			</button>
		</div>
		<details class="snippet-details">
			<summary>Quellcode anzeigen</summary>
			<pre class="snippet">{bookmarkletV2}</pre>
		</details>
		<p class="hint">
			Öffnet einen neuen Tab mit Mana, der Mana-Tab bekommt das HTML per
			<code>postMessage</code> von deinem Artikel-Tab. Braucht erlaubte Popups für diese Domain (Browser
			fragt beim ersten Mal).
		</p>
	</section>

	<section class="card">
		<h2>URL-Bookmarklet (klassisch)</h2>
		<p>
			Schickt nur die URL an Mana, der Server lädt + extrahiert dann selbst. Schnell auf einfachen
			Blogs / Wikis; scheitert auf Seiten hinter DSGVO-Zustimmungs-Dialogen.
		</p>
		<div class="bookmarklet-row">
			{#if bookmarkletV1}
				<a
					class="bookmarklet bookmarklet-secondary"
					href={bookmarkletV1}
					onclick={(e) => e.preventDefault()}
				>
					+ In Mana speichern (URL)
				</a>
			{:else}
				<span class="muted">Bookmarklet wird geladen…</span>
			{/if}
			<button
				type="button"
				class="copy-btn"
				onclick={() => copySnippet(bookmarkletV1, 'v1')}
				disabled={!bookmarkletV1}
			>
				{copyV1Label}
			</button>
		</div>
		<details class="snippet-details">
			<summary>Quellcode anzeigen</summary>
			<pre class="snippet">{bookmarkletV1}</pre>
		</details>
		<p class="hint">
			Funktioniert in jedem Desktop-Browser. In Safari: Lesezeichen mit beliebiger URL anlegen und
			die URL dann durch das Snippet ersetzen.
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
			Benutzt dieselbe URL-Route wie das klassische Bookmarklet oben — für cookie-gewalled Seiten
			lieber das HTML-Bookmarklet verwenden. iOS-Safari unterstützt die Web-Share-Target-API derzeit
			nicht.
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
		position: relative;
	}
	.card-recommended {
		border-color: color-mix(in srgb, #f97316 50%, transparent);
		background: color-mix(in srgb, #f97316 4%, transparent);
	}
	.badge {
		position: absolute;
		top: -0.55rem;
		left: 1rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: #f97316;
		color: white;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}
	.bookmarklet-secondary {
		background: transparent;
		color: #f97316;
		border: 1px solid #f97316;
	}
	.bookmarklet-secondary:hover {
		background: color-mix(in srgb, #f97316 10%, transparent);
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
