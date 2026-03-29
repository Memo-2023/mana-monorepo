# 🔐 Authentication Implementation Notes für ulo.ad

## Übersicht

Diese Dokumentation beschreibt wichtige Implementierungsdetails und Lösungen für häufige Probleme im Authentication-Flow von ulo.ad.

---

## ⚠️ Wichtige SvelteKit + PocketBase Quirks

### 1. Login Redirect Problem

**Problem:**
Nach erfolgreichem Login wird fälschlicherweise "Invalid email or password" angezeigt, obwohl der Login funktioniert hat.

**Ursache:**
SvelteKit's `redirect()` Funktion wirft intern eine Exception. Wenn diese im try-catch-Block steht, wird sie als Login-Fehler interpretiert.

**❌ Falsch:**

```typescript
// src/routes/login/+page.server.ts
try {
	await locals.pb.collection('users').authWithPassword(email, password);
	redirect(303, '/dashboard'); // ⚠️ Wirft Exception!
} catch (err) {
	return fail(400, { error: 'Invalid email or password' }); // Fängt redirect!
}
```

**✅ Richtig:**

```typescript
// src/routes/login/+page.server.ts
try {
	await locals.pb.collection('users').authWithPassword(email, password);
	locals.user = locals.pb.authStore.model;
} catch (err) {
	console.error('Login error:', err);
	return fail(400, { error: 'Invalid email or password' });
}

// Redirect AUSSERHALB des try-catch!
redirect(303, '/dashboard');
```

---

### 2. E-Mail Verifizierung Fehler

**Problem:**
PocketBase verifiziert den User erfolgreich, wirft aber trotzdem einen Fehler beim `confirmVerification()` Aufruf.

**Lösung:**

```typescript
// src/routes/verify-email/+page.server.ts
try {
	await pb.collection('users').confirmVerification(token);
	redirect(303, '/login?verified=true');
} catch (error) {
	// PocketBase wirft IMMER einen Fehler, auch bei Erfolg!
	if (errorMessage.includes('expired')) {
		redirect(303, '/login?error=token-expired');
	} else {
		// Behandle als Erfolg
		redirect(303, '/login?verified=true');
	}
}
```

---

### 3. Registrierung mit E-Mail-Versand

**Problem:**
E-Mail-Verifizierung wird nicht gesendet, wenn nach der Registrierung Auth-Operationen durchgeführt werden.

**Reihenfolge ist kritisch:**

```typescript
// src/routes/register/+page.server.ts

// 1. User erstellen
const newUser = await pb.collection('users').create({...});

// 2. ZUERST E-Mail senden (vor Auth-Operationen!)
await pb.collection('users').requestVerification(email);

// 3. DANN andere Operationen (z.B. Profil-Card erstellen)
await pb.collection('users').authWithPassword(email, password);
// ... weitere Operationen
pb.authStore.clear();

// 4. Zur Login-Seite weiterleiten (KEIN Auto-Login!)
redirect(303, '/login?registered=true');
```

---

## 📋 Best Practices

### Redirects in SvelteKit

1. **Immer außerhalb von try-catch**: Redirects gehören nicht in try-catch-Blöcke
2. **Return vs. Throw**: `redirect()` wirft eine Exception, `return fail()` gibt einen Wert zurück
3. **Error-First**: Erst alle Fehler behandeln, dann erfolgreiche Redirects

### PocketBase Authentication

1. **authStore.clear()**: Immer aufrufen wenn temporäre Auth benötigt wurde
2. **locals.user**: Nach Login setzen für sofortige Verfügbarkeit
3. **Verification**: Fehler als Erfolg behandeln (PocketBase Quirk)

### E-Mail-Versand

1. **Reihenfolge beachten**: E-Mails vor Auth-Operationen senden
2. **Template-Komplexität**: Bei Problemen vereinfachte Templates ohne Unicode verwenden
3. **Error-Handling**: E-Mail-Fehler nicht den ganzen Flow blockieren lassen

---

## 🐛 Debugging-Tipps

### Login-Probleme

```bash
# Console logs prüfen
console.error('Login error:', err);

# PocketBase Admin prüfen
http://localhost:8090/_/
# → Logs → Auth Logs
```

### E-Mail-Probleme

```bash
# SMTP Logs in PocketBase
http://localhost:8090/_/
# → Logs → Mails

# Template testen mit einfacher Version
docs/mail/email-templates-simplified.md
```

### Session-Probleme

```javascript
// Session-Status prüfen
console.log('Auth store valid:', locals.pb.authStore.isValid);
console.log('Current user:', locals.pb.authStore.model);
```

---

## 📁 Relevante Dateien

```
/src/routes/
├── login/
│   ├── +page.server.ts       # Login-Action mit korrektem Redirect
│   └── +page.svelte          # Status-Messages für Verifizierung
├── register/
│   └── +page.server.ts       # Registrierung mit E-Mail-Versand
├── verify-email/
│   └── +page.server.ts       # Verifizierung mit Fehler-als-Erfolg
└── (app)/
    └── +layout.server.ts     # User in locals setzen

/src/hooks.server.ts          # PocketBase Client initialisieren
```

---

## ✅ Checkliste für neue Auth-Features

- [ ] Redirects außerhalb von try-catch
- [ ] E-Mail-Versand vor Auth-Operationen
- [ ] PocketBase Fehler als mögliche Erfolge behandeln
- [ ] authStore.clear() nach temporären Auth-Operationen
- [ ] Proper error logging für Debugging
- [ ] User-freundliche Fehlermeldungen (bilingual)

---

_Erstellt: 15. Januar 2025_  
_Version: 1.0_  
_Für: ulo.ad Authentication System_
