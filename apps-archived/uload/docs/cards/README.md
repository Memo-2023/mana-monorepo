# Card System Dokumentation

## Übersicht

Das Card System in uload ist eine flexible, modulare Architektur für die Erstellung und Verwaltung von wiederverwendbaren UI-Karten. Es ermöglicht die Erstellung von dynamischen, themebaren und vollständig konfigurierbaren Karten für verschiedene Anwendungsfälle.

## Inhaltsverzeichnis

1. [Architektur](./architecture.md)
2. [Komponenten](./components.md)
3. [Module](./modules.md)
4. [Themes](./themes.md)
5. [Templates](./templates.md)
6. [API Reference](./api-reference.md)
7. [Beispiele](./examples.md)

## Schnellstart

### Basis-Verwendung

```svelte
<script>
	import BaseCard from '$lib/components/cards/BaseCard.svelte';

	const cardConfig = {
		variant: 'default',
		modules: [
			{
				type: 'header',
				props: {
					title: 'Meine Karte',
					subtitle: 'Eine Beispielkarte',
				},
			},
		],
	};
</script>

<BaseCard {...cardConfig} />
```

## Hauptkonzepte

### 1. BaseCard

Die zentrale Komponente, die als Container für alle Kartentypen dient.

### 2. Module

Wiederverwendbare Bausteine, aus denen Karten zusammengesetzt werden:

- HeaderModule
- ContentModule
- LinksModule
- MediaModule
- StatsModule
- ActionsModule
- FooterModule

### 3. Themes

Anpassbare Designsysteme mit Farben, Typografie, Abständen und Animationen.

### 4. Templates

Vordefinierte Kartenkonfigurationen für häufige Anwendungsfälle.

## Features

- 🎨 **Vollständig themebare Komponenten**
- 📦 **Modularer Aufbau**
- 💾 **Datenbankgestützte Konfiguration**
- 🎭 **Mehrere Varianten** (default, compact, hero, minimal, glass, gradient)
- 📱 **Responsive Design**
- ⚡ **Optimierte Performance**
- ♿ **Barrierefreiheit**

## Verwendung in der App

Das Card System wird in verschiedenen Bereichen der uload-App verwendet:

1. **Profilseiten** - Anzeige von Benutzerinformationen
2. **Link-Verwaltung** - Darstellung von Link-Sammlungen
3. **Dashboard** - Statistiken und Übersichten
4. **Template Store** - Marktplatz für Kartenvorlagen

## Nächste Schritte

- [Architektur verstehen](./architecture.md)
- [Erste eigene Karte erstellen](./examples.md#erste-karte)
- [Template Store erkunden](./templates.md#template-store)
