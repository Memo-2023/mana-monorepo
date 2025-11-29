# Toast Notifications - Implementation Plan

## 📋 Overview

Integration von **Svelte Sonner** für moderne Toast-Benachrichtigungen in uLoad.

## 🎯 Ziele

- Nutzer über Aktionen informieren (Erfolg, Fehler, Loading)
- Konsistente UX über die gesamte App
- Mobile-freundliche Benachrichtigungen
- Minimaler Setup mit maximaler Flexibilität

## 📦 Implementation Steps

### Phase 1: Installation & Setup

```bash
# 1. Package installieren
npm install svelte-sonner

# 2. Toaster in Root-Layout einbinden
# src/routes/+layout.svelte
```

### Phase 2: Basis-Integration

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import { Toaster } from 'svelte-sonner';
	// ... existing imports
</script>

<!-- Am Ende des Templates -->
<Toaster position="bottom-right" expand={false} richColors closeButton duration={4000} />
```

### Phase 3: Custom Styling

```css
/* src/app.css - Tailwind/Theme Integration */
:root {
	/* Light Mode */
	--sonner-toast-background: theme('colors.white');
	--sonner-toast-text: theme('colors.gray.900');
	--sonner-toast-border: theme('colors.gray.200');

	/* Success */
	--sonner-success-bg: theme('colors.green.50');
	--sonner-success-border: theme('colors.green.200');
	--sonner-success-text: theme('colors.green.800');

	/* Error */
	--sonner-error-bg: theme('colors.red.50');
	--sonner-error-border: theme('colors.red.200');
	--sonner-error-text: theme('colors.red.800');

	/* Info */
	--sonner-info-bg: theme('colors.blue.50');
	--sonner-info-border: theme('colors.blue.200');
	--sonner-info-text: theme('colors.blue.800');
}

.dark {
	/* Dark Mode */
	--sonner-toast-background: theme('colors.gray.800');
	--sonner-toast-text: theme('colors.gray.100');
	--sonner-toast-border: theme('colors.gray.700');

	/* Success */
	--sonner-success-bg: theme('colors.green.900/20');
	--sonner-success-border: theme('colors.green.800');
	--sonner-success-text: theme('colors.green.400');

	/* Error */
	--sonner-error-bg: theme('colors.red.900/20');
	--sonner-error-border: theme('colors.red.800');
	--sonner-error-text: theme('colors.red.400');
}
```

### Phase 4: Helper Service

```typescript
// src/lib/services/toast.ts
import { toast } from 'svelte-sonner';

export const notify = {
	// Success Messages
	success: (message: string) => toast.success(message),

	// Error Messages with optional details
	error: (message: string, details?: string) => {
		if (details) {
			toast.error(message, {
				description: details,
			});
		} else {
			toast.error(message);
		}
	},

	// Loading → Success/Error Pattern
	promise: async <T>(
		promise: Promise<T>,
		messages: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((error: any) => string);
		}
	) => {
		return toast.promise(promise, messages);
	},

	// Info Messages
	info: (message: string) => toast.info(message),

	// Custom with Actions
	action: (message: string, actionLabel: string, onAction: () => void) => {
		toast(message, {
			action: {
				label: actionLabel,
				onClick: onAction,
			},
		});
	},
};
```

## 🔄 Migration Plan

### 1. Username Setup Page

```typescript
// src/routes/(app)/setup-username/+page.svelte
import { notify } from '$lib/services/toast';

// Nach erfolgreichem Setzen
notify.success('Username erfolgreich gesetzt! 🎉');

// Bei Fehler
notify.error('Username bereits vergeben');
```

### 2. Link Management

```typescript
// Link erstellen
notify.promise(createLink(data), {
	loading: 'Link wird erstellt...',
	success: 'Link erfolgreich erstellt!',
	error: (err) => `Fehler: ${err.message}`,
});

// Link kopieren
notify.success('Link in Zwischenablage kopiert 📋');

// Link löschen mit Undo
notify.action('Link gelöscht', 'Rückgängig', async () => {
	await restoreLink(linkId);
	notify.success('Link wiederhergestellt');
});
```

### 3. Authentication

```typescript
// Login
notify.success('Erfolgreich angemeldet');

// Logout
notify.info('Erfolgreich abgemeldet');

// Email-Verifikation
notify.info('Bestätigungsmail wurde gesendet');

// Passwort zurücksetzen
notify.success('Passwort-Reset-Link wurde gesendet');
```

### 4. Profile Updates

```typescript
// Profil speichern
notify.promise(updateProfile(data), {
	loading: 'Profil wird aktualisiert...',
	success: 'Profil erfolgreich gespeichert',
	error: 'Fehler beim Speichern des Profils',
});

// Avatar hochladen
notify.promise(uploadAvatar(file), {
	loading: 'Bild wird hochgeladen...',
	success: 'Profilbild aktualisiert',
	error: 'Fehler beim Upload',
});
```

### 5. Subscription/Payment

```typescript
// Upgrade
notify.success('Erfolgreich auf Pro-Plan upgraded! 🚀');

// Payment failed
notify.error('Zahlung fehlgeschlagen', 'Bitte Zahlungsmethode überprüfen');

// Subscription cancelled
notify.info('Abo wurde gekündigt. Zugang bis Monatsende aktiv.');
```

## 🎨 Toast-Typen & Verwendung

| Typ         | Verwendung            | Beispiel                       |
| ----------- | --------------------- | ------------------------------ |
| **success** | Erfolgreiche Aktionen | "Link erstellt", "Gespeichert" |
| **error**   | Fehler & Probleme     | "Fehler beim Speichern"        |
| **info**    | Informationen         | "Neue Version verfügbar"       |
| **loading** | Laufende Prozesse     | "Wird geladen..."              |
| **promise** | Async-Operationen     | API-Calls, Datei-Uploads       |
| **action**  | Mit Aktion-Button     | "Gelöscht" → "Rückgängig"      |

## 📱 Mobile Considerations

- **Position**: `bottom-center` auf Mobile für bessere Erreichbarkeit
- **Swipe to dismiss**: Automatisch aktiviert
- **Stacking**: Maximal 3 Toasts gleichzeitig
- **Duration**: 4 Sekunden (außer bei Aktionen)

## 🧪 Testing Checklist

- [ ] Toast erscheint bei Success-Actions
- [ ] Toast erscheint bei Fehlern
- [ ] Promise-basierte Toasts zeigen alle 3 States
- [ ] Dark Mode Styling funktioniert
- [ ] Mobile Swipe-to-dismiss funktioniert
- [ ] Undo-Actions funktionieren
- [ ] Toasts stören keine anderen UI-Elemente
- [ ] Screen-Reader Kompatibilität

## 📊 Metriken

Nach Implementation tracken:

- Toast-Interaktionen (dismissals, action clicks)
- Häufigste Toast-Typen
- Durchschnittliche Anzeigedauer

## 🚀 Rollout

1. **Week 1**: Installation & Basic Setup
2. **Week 2**: Migration kritischer User-Flows (Login, Links)
3. **Week 3**: Vollständige Migration aller Feedback-Messages
4. **Week 4**: A/B Testing & Optimierung

## 📝 Notes

- Svelte Sonner unterstützt auch **Custom Components** als Toasts
- Bei Bedarf können wir spezielle Toast-Typen für uLoad erstellen (z.B. "Link-Preview-Toast")
- Toast-History könnte in Zukunft implementiert werden
