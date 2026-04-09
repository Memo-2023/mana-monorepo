# Sync-Debug auf mana.how

Ziel: rausfinden warum die 13 Pending-Changes nicht syncen.

## Bisheriger Stand

✅ **Schon bestätigt** (musst du nicht nochmal laufen lassen):

- `SYNC_URL = https://sync.mana.how` ✓
- LocalStorage hat `@auth/appToken` (454 Zeichen JWT, EdDSA, `kid: xQMrnC5JoHYGDRVlFQMUVdp9iBLPV4Tz`) und `@auth/refreshToken` (32-Zeichen-Opak)
- Der `kid` matcht den aktuellen Prod-JWKS — also kein Signing-Drift
- `sync.mana.how` ist erreichbar, Cloudflare → mana-core-sync funktioniert
- mana-core-sync Container ist healthy, DB existiert, Auth-Middleware antwortet

❓ **Offen:**

1. Welche Tabellen / appIds hängen tatsächlich (Schritt A)
2. Akzeptiert der Server unseren echten JWT (Schritt B)
3. Läuft der Client-seitige Sync-Channel überhaupt (Schritt C)

---

## Schritt A — Pending-Changes inspizieren

```js
(() => {
	const req = indexedDB.open('mana');
	req.onsuccess = () => {
		const db = req.result;
		if (!db.objectStoreNames.contains('_pendingChanges')) {
			console.log('Kein _pendingChanges store. Vorhandene stores:', [...db.objectStoreNames]);
			return;
		}
		const tx = db.transaction('_pendingChanges', 'readonly');
		const all = tx.objectStore('_pendingChanges').getAll();
		all.onsuccess = () => {
			const pending = all.result;
			const byApp = pending.reduce((a, p) => {
				a[p.appId] = (a[p.appId] || 0) + 1;
				return a;
			}, {});
			const byTable = pending.reduce((a, p) => {
				a[p.collection] = (a[p.collection] || 0) + 1;
				return a;
			}, {});
			console.log('Total pending:', pending.length);
			console.log('By appId:', byApp);
			console.log('By collection:', byTable);
			console.log('Oldest:', pending[0]);
			console.log('Newest:', pending[pending.length - 1]);
			console.log('All:', pending);
		};
		all.onerror = () => console.error('getAll error', all.error);
	};
	req.onerror = () => console.error('open error', req.error);
})();
```

Output: gib mir die Zeile `By appId:` — die brauche ich für Schritt B.

---

## Schritt B — Manueller Push mit dem echten JWT

Ersetz `APPID_HIER` durch eine appId aus Schritt A (z.B. `todo`, `photos`, `memoro`, `times`).

```js
(async () => {
	const url = window.__PUBLIC_SYNC_SERVER_URL__;
	const token = localStorage.getItem('@auth/appToken');
	console.log('Token segments:', token?.split('.').length, '(JWT muss 3 sein)');
	console.log('Token first 40:', token?.slice(0, 40));

	// Decode JWT payload um aud/iss/exp/sub zu sehen:
	try {
		const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
		console.log('JWT payload:', payload);
		console.log(
			'expired?',
			payload.exp * 1000 < Date.now(),
			'exp:',
			new Date(payload.exp * 1000).toISOString()
		);
	} catch (e) {
		console.error('JWT decode failed:', e);
	}

	const res = await fetch(`${url}/sync/APPID_HIER`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			'X-Client-Id': 'debug-probe',
		},
		body: JSON.stringify({ clientId: 'debug-probe', since: '', changes: [] }),
	});
	console.log('Status:', res.status);
	console.log('Body:', await res.text());
})();
```

Was die Antwort bedeutet:

| Status               | Diagnose                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `200`                | Server akzeptiert Token + Body → Bug ist **im Client**: Sync-Loop läuft nicht oder der auth-Store reicht den Token nicht weiter |
| `401`                | JWT-Validierung scheitert. Payload aus dem `atob()`-Decode sagt warum: `aud` mismatch, `exp` abgelaufen, `iss` falsch           |
| `403`                | Token gültig, aber RLS / appId-Mapping verweigert Zugriff                                                                       |
| `400`                | Auth ok, aber Body-Schema unerwartet → Protokoll-Drift Client↔Server                                                            |
| `5xx`                | Server-Bug                                                                                                                      |
| Network error / CORS | URL/CORS kaputt (unwahrscheinlich, curl-Probe hat funktioniert)                                                                 |

---

## Schritt C — Client-seitiger Sync-Channel-State

```js
(() => {
	const u = window.__unifiedSync;
	if (!u) {
		console.log(
			'window.__unifiedSync ist nicht gesetzt. unifiedSync wurde nie initialisiert (vermutlich ist authStore.isAuthenticated = false beim Mount des (app)-Layouts).'
		);
		return;
	}
	console.log('Debug info:', u.getDebugInfo());
	console.log('Status:', u.status, 'online:', u.online);
})();
```

`getDebugInfo()` liefert pro Channel:

- `appId`, `tables` (welche Dexie-Tabellen syncen)
- `lastError` (letzter Fehler — wenn `null`, lief noch nichts schief)
- `hasPushTimer` / `hasPullTimer` (ob ein Timer aktiv ist)
- `knownAppIds` als Top-Level — vergleich mit `byApp` aus Schritt A: jede appId aus Schritt A muss in `knownAppIds` enthalten sein, sonst werden ihre pending changes silently nie pushen.

Außerdem: ab dieser Sync-Patch-Version logged der Push silently failures als `console.warn`:

- `[mana-sync] push: no channel registered for appId="..."` → Schreib-/Registry-Drift, Schritt A appId fehlt im SYNC_APP_MAP
- `[mana-sync] push[X]: getToken() returned null` → Token-Refresh ist gescheitert

Wenn `__unifiedSync` nicht auf `window` hängt, zeig mir zusätzlich das aus der **Network**-Tab:

1. Filter `sync.mana.how`
2. Reload (Cmd+R)
3. Screenshot — was sehen wir? Requests? Welcher Status?

---

## Wichtigste Reihenfolge

1. **Schritt A** zuerst → sagt uns welche appIds betroffen sind
2. **Schritt B** mit einer dieser appIds → entscheidet ob Bug Server- oder Client-seitig ist
3. **Schritt C** nur wenn Schritt B `200` zurückgibt (= Bug ist client-seitig)

Schritt B ist der diagnostische Schlüssel — alles andere folgt aus seinem Status-Code.
