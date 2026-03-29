---
title: 'Erstelle einen persönlichen Blog mit Astro'
description: 'Lerne, wie du einen modernen, performanten Blog mit Astro und Markdown erstellst und ihn kostenlos veröffentlichst.'
pubDate: 2025-03-25
difficulty: 'beginner'
duration: '2-3 Stunden'
skills: ['Astro', 'Markdown', 'CSS', 'HTML']
image: '/images/missions/astro-blog.png'
featured: true
status: 'active'
category: 'Business'
participants: ['Max Müller', 'Jana Schmidt', 'Tobias Weber']
githubRepo: 'https://github.com/bauntown/astro-blog-mission'
---

# Erstelle einen persönlichen Blog mit Astro

In dieser Mission wirst du einen modernen, schnellen Blog mit Astro erstellen, der Markdown für Inhalte verwendet, und ihn kostenlos veröffentlichen.

## Missionsziele

Nach Abschluss dieser Mission wirst du:

1. Eine Astro-Webanwendung von Grund auf erstellt haben
2. Markdown für Blogposts verwenden können
3. Eine responsive Layout-Struktur implementiert haben
4. Eine Kategorien- und Tagging-Funktionalität hinzugefügt haben
5. Deinen Blog kostenlos veröffentlicht haben

## Voraussetzungen

- Grundlegende HTML-, CSS- und JavaScript-Kenntnisse
- Grundlegende Terminal/Kommandozeilen-Kenntnisse
- Node.js und npm installiert
- Ein GitHub-Konto

Keine Sorge, wenn du nicht alle Voraussetzungen erfüllst. Diese Mission eignet sich auch für Anfänger und enthält Schritt-für-Schritt-Anleitungen.

## Schritt 1: Astro-Projekt einrichten

Wir beginnen mit der Einrichtung eines neuen Astro-Projekts. Öffne dein Terminal und führe die folgenden Befehle aus:

```bash
# Erstelle ein neues Astro-Projekt
npm create astro@latest my-blog

# Navigiere in das Projektverzeichnis
cd my-blog

# Starte den Entwicklungsserver
npm run dev
```

Besuche `http://localhost:3000` in deinem Browser, um deine neue Astro-Website zu sehen.

## Schritt 2: Blog-Layout erstellen

Als Nächstes erstellen wir ein grundlegendes Layout für unseren Blog. Erstelle eine neue Datei unter `src/layouts/BlogLayout.astro`:

```astro
---
// src/layouts/BlogLayout.astro
const { title, description } = Astro.props;
---

<!doctype html>
<html lang="de">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>{title}</title>
		<meta name="description" content={description} />
		<link rel="stylesheet" href="/styles/global.css" />
	</head>
	<body>
		<header>
			<div class="container">
				<a href="/" class="logo">Mein Blog</a>
				<nav>
					<ul>
						<li><a href="/">Home</a></li>
						<li><a href="/blog">Blog</a></li>
						<li><a href="/about">Über mich</a></li>
					</ul>
				</nav>
			</div>
		</header>

		<main class="container">
			<slot />
		</main>

		<footer>
			<div class="container">
				<p>&copy; {new Date().getFullYear()} Mein Blog. Alle Rechte vorbehalten.</p>
			</div>
		</footer>
	</body>
</html>
```

Erstelle nun eine CSS-Datei für unser globales Styling unter `public/styles/global.css`:

```css
/* public/styles/global.css */
:root {
	--color-primary: #3b82f6;
	--color-text: #1f2937;
	--color-text-light: #6b7280;
	--color-bg: #ffffff;
	--color-bg-dark: #f3f4f6;
	--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

* {
	box-sizing: border-box;
	margin: 0;
}

html {
	font-family: var(--font-sans);
	color: var(--color-text);
	background-color: var(--color-bg);
}

body {
	line-height: 1.6;
}

a {
	color: var(--color-primary);
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}

h1,
h2,
h3,
h4,
h5,
h6 {
	margin: 1.5rem 0 1rem;
	line-height: 1.2;
}

h1 {
	font-size: 2.25rem;
}

p,
ul,
ol {
	margin-bottom: 1.25rem;
}

.container {
	width: 90%;
	max-width: 800px;
	margin: 0 auto;
	padding: 0 1rem;
}

header {
	padding: 1.5rem 0;
	border-bottom: 1px solid #e5e7eb;
	margin-bottom: 2rem;
}

header .container {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.logo {
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--color-text);
}

nav ul {
	display: flex;
	list-style: none;
	padding: 0;
	margin: 0;
}

nav li {
	margin-left: 1.5rem;
}

nav a {
	color: var(--color-text);
}

footer {
	margin-top: 4rem;
	padding: 2rem 0;
	text-align: center;
	color: var(--color-text-light);
	font-size: 0.875rem;
	border-top: 1px solid #e5e7eb;
}

main {
	min-height: 70vh;
}
```

## Schritt 3: Erstelle deine ersten Blogposts

Jetzt erstellen wir einige Blogposts mit Markdown. Erstelle ein neues Verzeichnis `src/pages/blog/` und füge dort zwei Markdown-Dateien hinzu.

Erstelle `src/pages/blog/erster-post.md`:

```markdown
---
layout: ../../layouts/BlogPostLayout.astro
title: Mein erster Blogpost
date: 2025-03-01
author: Dein Name
description: Dies ist mein allererster Blogpost auf meiner neuen Astro-Website.
image: /images/first-post.jpg
alt: Ein Bild meines ersten Posts
tags: ['astro', 'blogging', 'erste Schritte']
---

# Mein erster Blogpost

Veröffentlicht am 1. März 2025

Willkommen zu meinem ersten Blogpost! Hier werde ich über meine Erfahrungen mit Astro berichten.

## Warum ich Astro gewählt habe

Astro ist ein modernes statisches Site-Generator, der perfekt für Content-fokussierte Websites wie Blogs ist. Hier sind einige Gründe, warum ich mich für Astro entschieden habe:

1. **Leistung**: Astro lädt nur den JavaScript-Code, der tatsächlich benötigt wird
2. **Flexibilität**: Ich kann meine bevorzugten UI-Komponenten verwenden
3. **Markdown-Integration**: Perfekt für Blogposts!
```

Erstelle `src/pages/blog/zweiter-post.md`:

```markdown
---
layout: ../../layouts/BlogPostLayout.astro
title: Mein zweiter Blogpost
date: 2025-03-10
author: Dein Name
description: In diesem Post spreche ich über meine ersten Wochen mit Astro.
image: /images/second-post.jpg
alt: Ein Bild meines zweiten Posts
tags: ['astro', 'fortschritt', 'lernen']
---

# Mein zweiter Blogpost

Veröffentlicht am 10. März 2025

Nach einigen Wochen mit Astro kann ich sagen, dass ich begeistert bin! Die Entwicklungserfahrung ist hervorragend.

## Was ich bisher gelernt habe

- Astro-Projektstruktur
- Komponenten erstellen
- Markdown für Inhalte nutzen
- Daten zwischen Seiten teilen

Das Beste ist, dass die Seiten unglaublich schnell laden!
```

## Schritt 4: Blogpost-Layout erstellen

Jetzt benötigen wir ein spezielles Layout für unsere Blogposts. Erstelle eine neue Datei unter `src/layouts/BlogPostLayout.astro`:

```astro
---
// src/layouts/BlogPostLayout.astro
import BlogLayout from './BlogLayout.astro';

const { frontmatter } = Astro.props;
const { title, date, author, image, alt, tags, description } = frontmatter;

// Formatiere das Datum
const formattedDate = new Date(date).toLocaleDateString('de-DE', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
});
---

<BlogLayout title={title} description={description}>
	<article class="blog-post">
		<div class="post-header">
			<h1>{title}</h1>
			<p class="post-meta">
				Veröffentlicht am {formattedDate} von {author}
			</p>

			{
				tags && (
					<div class="tags">
						{tags.map((tag) => (
							<a href={`/tags/${tag}`} class="tag">
								{tag}
							</a>
						))}
					</div>
				)
			}
		</div>

		{
			image && (
				<div class="featured-image">
					<img src={image} alt={alt || title} />
				</div>
			)
		}

		<div class="post-content">
			<slot />
		</div>
	</article>
</BlogLayout>

<style>
	.blog-post {
		max-width: 700px;
		margin: 0 auto;
	}

	.post-header {
		margin-bottom: 2rem;
	}

	.post-meta {
		color: var(--color-text-light);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.featured-image {
		margin-bottom: 2rem;
	}

	.featured-image img {
		width: 100%;
		border-radius: 8px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.tag {
		background-color: var(--color-bg-dark);
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		text-transform: lowercase;
		color: var(--color-text-light);
	}

	.tag:hover {
		background-color: var(--color-primary);
		color: white;
		text-decoration: none;
	}

	.post-content {
		line-height: 1.8;
	}

	.post-content h2 {
		margin-top: 2rem;
	}

	.post-content p {
		margin-bottom: 1.5rem;
	}

	.post-content ul,
	.post-content ol {
		padding-left: 1.5rem;
	}
</style>
```

## Schritt 5: Blog-Übersichtsseite erstellen

Nun erstellen wir eine Übersichtsseite für alle Blogposts. Erstelle eine neue Datei unter `src/pages/blog/index.astro`:

```astro
---
// src/pages/blog/index.astro
import BlogLayout from '../../layouts/BlogLayout.astro';
import { getCollection } from 'astro:content';

// Sammle alle Markdown-Dateien im Blog-Verzeichnis
const posts = await Astro.glob('./*.md');

// Sortiere Posts nach Datum (neueste zuerst)
const sortedPosts = posts.sort((a, b) => {
	return new Date(b.frontmatter.date).valueOf() - new Date(a.frontmatter.date).valueOf();
});
---

<BlogLayout title="Blog" description="Lese meine neuesten Blogposts">
	<div class="blog-index">
		<h1>Blog</h1>
		<p class="intro">Hier findest du alle meine Blogposts.</p>

		<div class="posts">
			{
				sortedPosts.map((post) => (
					<div class="post-card">
						{post.frontmatter.image && (
							<a href={post.url} class="post-image-link">
								<img
									src={post.frontmatter.image}
									alt={post.frontmatter.alt || post.frontmatter.title}
									class="post-image"
								/>
							</a>
						)}

						<div class="post-content">
							<h2 class="post-title">
								<a href={post.url}>{post.frontmatter.title}</a>
							</h2>

							<p class="post-meta">
								{new Date(post.frontmatter.date).toLocaleDateString('de-DE', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</p>

							<p class="post-description">{post.frontmatter.description}</p>

							<a href={post.url} class="read-more">
								Weiterlesen
							</a>
						</div>
					</div>
				))
			}
		</div>
	</div>
</BlogLayout>

<style>
	.blog-index {
		max-width: 800px;
		margin: 0 auto;
	}

	.intro {
		font-size: 1.125rem;
		margin-bottom: 2rem;
	}

	.posts {
		display: grid;
		gap: 2rem;
	}

	.post-card {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 2rem;
	}

	@media (min-width: 640px) {
		.post-card {
			grid-template-columns: 200px 1fr;
		}
	}

	.post-image-link {
		display: block;
		overflow: hidden;
		border-radius: 8px;
	}

	.post-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.post-image:hover {
		transform: scale(1.05);
	}

	.post-title {
		font-size: 1.5rem;
		margin: 0 0 0.5rem 0;
	}

	.post-title a {
		color: var(--color-text);
	}

	.post-meta {
		color: var(--color-text-light);
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	.post-description {
		margin-bottom: 1rem;
	}

	.read-more {
		font-weight: 500;
		font-size: 0.875rem;
	}
</style>
```

## Schritt 6: Startseite erstellen

Jetzt erstellen wir eine einfache Startseite. Ersetze den Inhalt von `src/pages/index.astro` mit folgendem:

```astro
---
// src/pages/index.astro
import BlogLayout from '../layouts/BlogLayout.astro';

// Neueste Posts holen
const posts = await Astro.glob('./blog/*.md');
const recentPosts = posts
	.sort((a, b) => new Date(b.frontmatter.date).valueOf() - new Date(a.frontmatter.date).valueOf())
	.slice(0, 3);
---

<BlogLayout
	title="Mein Blog"
	description="Ein persönlicher Blog über Webentwicklung, Technologie und mehr"
>
	<section class="hero">
		<h1>Willkommen auf meinem Blog</h1>
		<p>Ein persönlicher Blog über Webentwicklung, Technologie und mehr.</p>
	</section>

	<section class="recent-posts">
		<div class="section-header">
			<h2>Neueste Blogposts</h2>
			<a href="/blog" class="view-all">Alle anzeigen</a>
		</div>

		<div class="post-grid">
			{
				recentPosts.map((post) => (
					<div class="post-card">
						{post.frontmatter.image && (
							<a href={post.url}>
								<img
									src={post.frontmatter.image}
									alt={post.frontmatter.alt || post.frontmatter.title}
									class="post-image"
								/>
							</a>
						)}

						<h3>
							<a href={post.url}>{post.frontmatter.title}</a>
						</h3>

						<p class="post-meta">
							{new Date(post.frontmatter.date).toLocaleDateString('de-DE', {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
							})}
						</p>

						<p class="post-excerpt">{post.frontmatter.description}</p>
					</div>
				))
			}
		</div>
	</section>
</BlogLayout>

<style>
	.hero {
		padding: 4rem 0;
		text-align: center;
		margin-bottom: 3rem;
	}

	.hero h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.hero p {
		font-size: 1.25rem;
		color: var(--color-text-light);
		max-width: 600px;
		margin: 0 auto;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.view-all {
		font-size: 0.875rem;
	}

	.post-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.post-card {
		display: flex;
		flex-direction: column;
	}

	.post-image {
		aspect-ratio: 16 / 9;
		object-fit: cover;
		width: 100%;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.post-excerpt {
		color: var(--color-text-light);
		margin-top: 0.5rem;
		flex-grow: 1;
	}

	.post-meta {
		color: var(--color-text-light);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}
</style>
```

## Schritt 7: "Über mich"-Seite erstellen

Jetzt erstellen wir eine einfache "Über mich"-Seite. Erstelle eine neue Datei unter `src/pages/about.astro`:

```astro
---
// src/pages/about.astro
import BlogLayout from '../layouts/BlogLayout.astro';
---

<BlogLayout title="Über mich" description="Erfahre mehr über mich und meinen Blog">
	<section class="about">
		<h1>Über mich</h1>

		<div class="about-content">
			<div class="about-image">
				<img src="/images/profile.jpg" alt="Profilbild" />
			</div>

			<div class="about-text">
				<p>
					Hallo! Ich bin [Dein Name], ein leidenschaftlicher Webentwickler mit Interesse an modernen
					Technologien und Frameworks.
				</p>

				<p>
					Diesen Blog habe ich erstellt, um meine Lernerfahrungen und Projekte zu dokumentieren. Ich
					schreibe hauptsächlich über:
				</p>

				<ul>
					<li>Webentwicklung</li>
					<li>Frontend-Technologien</li>
					<li>Best Practices im Webdesign</li>
					<li>Meine persönlichen Projekte</li>
				</ul>

				<p>Wenn du Fragen hast oder in Kontakt treten möchtest, findest du mich auf:</p>

				<div class="social-links">
					<a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer"
						>GitHub</a
					>
					<a href="https://twitter.com/yourusername" target="_blank" rel="noopener noreferrer"
						>Twitter</a
					>
					<a href="mailto:your.email@example.com">E-Mail</a>
				</div>
			</div>
		</div>
	</section>
</BlogLayout>

<style>
	.about {
		max-width: 800px;
		margin: 0 auto;
	}

	.about-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		margin-top: 2rem;
	}

	@media (min-width: 768px) {
		.about-content {
			grid-template-columns: 1fr 2fr;
		}
	}

	.about-image img {
		width: 100%;
		max-width: 300px;
		border-radius: 8px;
	}

	.about-text p {
		margin-bottom: 1.5rem;
	}

	.social-links {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.social-links a {
		padding: 0.5rem 1rem;
		background-color: var(--color-primary);
		color: white;
		border-radius: 4px;
		transition: opacity 0.2s ease;
	}

	.social-links a:hover {
		opacity: 0.9;
		text-decoration: none;
	}
</style>
```

## Schritt 8: Bilder hinzufügen

Erstelle ein Verzeichnis für Bilder unter `public/images/` und füge dort folgende Bilder hinzu:

- `first-post.jpg` (für deinen ersten Blogpost)
- `second-post.jpg` (für deinen zweiten Blogpost)
- `profile.jpg` (für deine "Über mich"-Seite)

Du kannst eigene Bilder verwenden oder Beispielbilder von Diensten wie [Unsplash](https://unsplash.com/) herunterladen.

## Schritt 9: Seite veröffentlichen

Es gibt mehrere Möglichkeiten, deinen Astro-Blog zu veröffentlichen. Wir verwenden hier [Netlify](https://www.netlify.com/), da es einen großzügigen kostenlosen Plan anbietet.

1. Erstelle ein Git-Repository für dein Projekt:

```bash
git init
git add .
git commit -m "Initial commit"
```

2. Erstelle ein Repository auf GitHub und pushe deinen Code dorthin

3. Melde dich bei Netlify an oder erstelle ein neues Konto

4. Klicke auf "New site from Git" und wähle dein GitHub-Repository aus

5. Verwende die folgenden Build-Einstellungen:
   - Build command: `npm run build`
   - Publish directory: `dist`

6. Klicke auf "Deploy site"

Netlify wird automatisch deine Seite erstellen und veröffentlichen. Du erhältst eine URL wie `https://your-site-name.netlify.app`, unter der dein Blog erreichbar ist.

## Bonus: Tag-Seiten erstellen

Als Bonus-Feature erstellen wir dynamische Seiten für Tags. Erstelle eine neue Datei unter `src/pages/tags/[tag].astro`:

```astro
---
// src/pages/tags/[tag].astro
import BlogLayout from '../../layouts/BlogLayout.astro';

export async function getStaticPaths() {
	const posts = await Astro.glob('../blog/*.md');

	// Alle Tags sammeln
	const allTags = posts.reduce((tags, post) => {
		const postTags = post.frontmatter.tags || [];
		postTags.forEach((tag) => {
			if (!tags.includes(tag)) {
				tags.push(tag);
			}
		});
		return tags;
	}, []);

	// Einen Pfad für jeden Tag erstellen
	return allTags.map((tag) => {
		// Posts filtern, die diesen Tag enthalten
		const filteredPosts = posts.filter(
			(post) => post.frontmatter.tags && post.frontmatter.tags.includes(tag)
		);

		return {
			params: { tag },
			props: { posts: filteredPosts, tag },
		};
	});
}

const { posts, tag } = Astro.props;
---

<BlogLayout title={`Posts mit Tag: ${tag}`} description={`Alle Blogposts mit dem Tag ${tag}`}>
	<div class="tag-page">
		<h1>Posts mit Tag: <span class="highlight">{tag}</span></h1>

		<div class="posts">
			{
				posts.map((post) => (
					<div class="post-card">
						{post.frontmatter.image && (
							<a href={post.url} class="post-image-link">
								<img
									src={post.frontmatter.image}
									alt={post.frontmatter.alt || post.frontmatter.title}
									class="post-image"
								/>
							</a>
						)}

						<div class="post-content">
							<h2 class="post-title">
								<a href={post.url}>{post.frontmatter.title}</a>
							</h2>

							<p class="post-meta">
								{new Date(post.frontmatter.date).toLocaleDateString('de-DE', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</p>

							<p class="post-description">{post.frontmatter.description}</p>

							<a href={post.url} class="read-more">
								Weiterlesen
							</a>
						</div>
					</div>
				))
			}
		</div>

		<div class="back-link">
			<a href="/blog">← Zurück zu allen Posts</a>
		</div>
	</div>
</BlogLayout>

<style>
	.tag-page {
		max-width: 800px;
		margin: 0 auto;
	}

	.highlight {
		color: var(--color-primary);
	}

	.posts {
		display: grid;
		gap: 2rem;
		margin: 2rem 0;
	}

	.post-card {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 2rem;
	}

	@media (min-width: 640px) {
		.post-card {
			grid-template-columns: 200px 1fr;
		}
	}

	.post-image-link {
		display: block;
		overflow: hidden;
		border-radius: 8px;
	}

	.post-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.post-image:hover {
		transform: scale(1.05);
	}

	.post-title {
		font-size: 1.5rem;
		margin: 0 0 0.5rem 0;
	}

	.post-title a {
		color: var(--color-text);
	}

	.post-meta {
		color: var(--color-text-light);
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	.post-description {
		margin-bottom: 1rem;
	}

	.read-more {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.back-link {
		margin-top: 2rem;
	}
</style>
```

## Herzlichen Glückwunsch!

Du hast erfolgreich einen persönlichen Blog mit Astro erstellt und veröffentlicht! Hier sind einige Ideen für die Weiterentwicklung:

- Eine Suchfunktion hinzufügen
- Kommentarfunktion mit Disqus oder Utterances integrieren
- Eine Kontaktseite mit Formular erstellen
- Dark Mode implementieren
- Analytics hinzufügen, um Besuche zu tracken

Wenn du Fragen hast oder Hilfe benötigst, zögere nicht, im GitHub-Repository der Mission einen Issue zu erstellen oder dich an die Community zu wenden!

Happy Blogging! 🚀
