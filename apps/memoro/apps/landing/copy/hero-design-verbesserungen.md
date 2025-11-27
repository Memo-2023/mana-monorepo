# Hero Design Verbesserungen

## 🎨 Aktuelle Design-Probleme

1. **Social Proof Box**: Zu dunkel und verschmilzt mit dem Hintergrund
2. **Trust Badges**: Zu klein und unauffällig
3. **Bild-Qualität**: Das Bild wirkt etwas dunkel/unscharf
4. **Visueller Fluss**: Die Elemente wirken noch nicht optimal verbunden
5. **CTAs**: Könnten noch mehr hervorstechen

## 💡 Design-Verbesserungsvorschläge

### 1. Social Proof Redesign

```css
/* Heller, auffälliger Hintergrund */
background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
border: 1px solid rgba(255, 255, 255, 0.2);
backdrop-filter: blur(10px);
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
```

### 2. Trust Badges Enhancement

- Größere Icons und Text
- Eigene Cards für jeden Badge
- Leichter Hover-Effekt
- Bessere Spacing

### 3. Hero Image Improvements

- Overlay mit Gradient für besseren Kontrast
- Subtle Animation beim Laden
- Optional: Mehrere Bilder im Wechsel

### 4. Typography & Spacing

- Größerer Zeilenabstand für bessere Lesbarkeit
- Stärkerer Kontrast zwischen Headline und Subtitle
- Mehr Whitespace zwischen Elementen

### 5. CTA Buttons Enhancement

- Primär-Button: Stärkerer Glow-Effekt
- Sekundär-Button: Besserer Kontrast
- Micro-interactions beim Hover

### 6. Animations & Effects

- Fade-in Animation für alle Elemente
- Parallax-Effekt für das Bild
- Smooth reveal beim Scrollen

## 🚀 Quick Implementation

### Sofort umsetzbar:

1. Social Proof Box aufhellen
2. Trust Badges vergrößern und besser positionieren
3. CTA Buttons optimieren
4. Micro-Copy prominenter machen

### Mittelfristig:

1. Animationen hinzufügen
2. Bild-Overlay optimieren
3. Mobile Optimierungen

## 📐 Konkrete CSS-Änderungen

### Social Proof Box

```astro
<div
	class="mt-8 p-6 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/20 backdrop-blur-sm shadow-lg"
>
</div>
```

### Trust Badges

```astro
<div class="flex flex-wrap gap-6 mt-10 justify-center md:justify-start">
	{
		trustBadges.map((badge) => (
			<div class="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
				<span class="text-2xl">{badge.icon}</span>
				<span class="text-sm font-medium text-text-primary">{badge.text}</span>
			</div>
		))
	}
</div>
```

### CTA Buttons

```css
/* Primary Button mit Glow */
.bg-primary {
	box-shadow: 0 4px 20px rgba(255, 193, 7, 0.3);
	transition: all 0.3s ease;
}

.bg-primary:hover {
	box-shadow: 0 6px 30px rgba(255, 193, 7, 0.5);
	transform: translateY(-2px);
}
```

### Hero Image Container

```astro
<div class="relative order-2 md:order-1 overflow-hidden rounded-2xl">
	<div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
	<img
		src={image}
		alt={title}
		class="w-full h-auto object-cover shadow-2xl transform hover:scale-105 transition-transform duration-700"
	/>
</div>
```
