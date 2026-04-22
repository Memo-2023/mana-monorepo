# Data Export / Import — v2

## Status (2026-04-22)

Proposed. Ersetzt den bisherigen server-cipher-Backup-Pfad (noch
nicht GA, niemand hat Produktionsdaten davon erstellt) durch ein
einziges client-getriebenes Export/Import-System.

## Ziel

Ein Mana-User kann seine Daten (ganz oder modulweise) als portable,
menschenlesbare Datei exportieren und wieder importieren. Das System
ist:

- **Ein Pfad**, nicht zwei. Kein „Server-Dump vs. Client-Dump" mit
  abweichenden Features.
- **Snapshot-basiert** (pro Tabelle eine `.jsonl` mit dem aktuellen
  Row-Stand), nicht sync-event-replay. Kleiner, lesbarer, importierbar
  in beliebige andere Tools.
- **Plaintext als Default**. GDPR-Art.-20-Datenübertragbarkeit ist ein
  Feature, kein Edge-Case. Der User muss seine eigenen Daten lesen
  können ohne Mana zu installieren.
- **Optional passphrase-wrapped** für Transport (z. B. Cloud-Ablage).
  Nutzt Web-Crypto-Standard-Primitive — unabhängig vom Mana-Vault.
- **Modul-selektiv**. User wählt Module-Checkboxen, Export enthält
  nur deren Tabellen.
- **Cross-Account-migrationsfähig**. Plaintext-Datei aus Account A
  → Import in Account B → B's Vault-Key verschlüsselt das beim
  `bulkPut` automatisch.

## Abgrenzung

- **Kein Event-Replay-Format mehr**. Feld-Level-LWW-Timestamps, Actor-
  Attribution, causedBy-Chains gehen im Snapshot verloren. Für Backup-
  Zwecke egal — der User will seinen aktuellen State, nicht die
  Historie. Wenn debug-fähige Event-Dumps jemals gebraucht werden,
  kriegen die einen eigenen CLI-Pfad (nicht User-facing).
- **Kein Foreign-Format-Native-Export** (Pocket-CSV, OPML, ICS). Die
  sind Adapter die `.mana-v2` transformieren — nicht dritte Pfade im
  Core-Code. Bauen wir nur wenn konkreter Bedarf entsteht.
- **Kein Inkrementelles Backup**. Erster Wurf ist „voller Snapshot pro
  Export". Delta-Backups kommen falls jemand GB-Datasets fährt — heute
  irrelevant.
- **Keine Key-Transfer-Semantik für Zero-Knowledge-Cross-Account**.
  Wenn Account A im ZK-Mode läuft und der User nach B wechselt, muss
  er während des Exports den Vault entsperren — dann klappt's wie bei
  regulären Usern.

## Entscheidungen vorab

- **Format-Versionsbruch**. Die alten `.mana-v1`-Dateien (Event-Stream
  aus mana-sync) sind nicht migrierbar nach v2 — unterschiedliche
  Semantik. Da keine Produktionsdaten existieren, löschen wir v1
  komplett (Code + Endpoint).
- **Client-seitig vollständig**. Kein HTTP-Roundtrip fürs Export.
  Funktioniert offline, überlebt mana-sync-Ausfälle, braucht keine
  Server-Rolle.
- **Zip-Container + jsonl-Dateien**, pro Tabelle eine Datei. Gleiche
  Technik wie v1 (`pako` für Deflate ist schon im Repo), aber mit
  neuem Inhalts-Schema.
- **Passphrase-Crypto** ist **nicht** das Per-Feld-AES-GCM aus dem
  Vault. Stattdessen: PBKDF2-SHA-256 (600k Iterations, OWASP 2023-
  Empfehlung) für KDF + AES-GCM-256 als AEAD. Web Crypto native, kein
  argon2-Dep. Die Entscheidung gegen Argon2id: eine einzelne 32-KB-
  Entschlüsselung bei 600k PBKDF2 cost ~200 ms — ausreichend schwer
  gegen offline-Brute-force, gut handhabbar als UX. Wenn wir später
  Argon2id wollen, ist das ein additives Field-Update im Manifest.
- **Per-Field-Decrypt nutzt den existierenden `decryptRecord()`-Pfad**
  aus `crypto/record-helpers.ts`. Keine Duplikat-Logik für Export.
- **Per-Field-Re-Encrypt beim Import nutzt `encryptRecord()`**.
  `ENCRYPTION_REGISTRY` bestimmt was verschlüsselt wird — wenn sich
  die Allowlist später ändert, reagiert der Import mit.
- **Schema-Version im Manifest** — sobald das Row-Shape einer Tabelle
  sich ändert (Dexie-Version-Bump mit Migration), bekommt der
  Exporter das via Manifest-Schema-Version. Import prüft und refused
  ältere Schemas mit klarer Fehlermeldung statt still zu korrumpieren.

## Format: `.mana` v2

```
archive.mana         (zip container, DEFLATE, no password protection on zip level)
├── manifest.json
├── data/
│   ├── articles.jsonl              Eine Zeile pro Row (JSON object)
│   ├── articleHighlights.jsonl
│   ├── articleTags.jsonl
│   ├── globalTags.jsonl
│   ├── tagGroups.jsonl
│   ├── notes.jsonl
│   ├── …                           Je nach scope + MODULE_CONFIGS
└── README.md                       Menschenlesbar, erklärt Inhalt
```

### `manifest.json`

```typescript
interface BackupManifestV2 {
  /** Hardcoded `2`. Bump on breaking changes only. */
  formatVersion: 2;

  /** Mana app schema version at export time — derived from Dexie version. */
  schemaVersion: number;

  /** Who generated this. Informational, not verified. */
  producedBy: string;  // z.B. "mana-web/1.2.3"

  /** ISO timestamp of export. */
  exportedAt: string;

  /** userId at export time. Informational; importer does NOT refuse cross-account. */
  userId: string;

  /** Scope declaration. */
  scope:
    | { type: 'full' }
    | { type: 'filtered'; appIds: string[] };

  /** Row-Count pro Tabelle (für UI-Progress + quick-validate). */
  rowCounts: Record<string, number>;

  /** Plaintext der encrypted fields im JSON (true) oder re-exportiert mit */
  /** dem Mana-Vault-Key (false)? Default true. false wäre absurd — der    */
  /** Export-Receiver hätte keinen Vault. Behalten als Flag damit Zukunfts-*/
  /** Clients mit z.B. Vault-Sync denselben Parser wiederverwenden können. */
  fieldsPlaintext: boolean;

  /** Wrap-Info wenn passphrase-protected, sonst `undefined`. */
  passphrase?: {
    kdf: 'PBKDF2-SHA256';
    kdfIterations: number;         // 600_000
    kdfSaltBase64: string;         // 16 bytes random
    cipher: 'AES-GCM-256';
    ivBase64: string;              // 12 bytes random
    /** SHA256 der plaintext `data/`-Konkatenation, hex. Post-unwrap-integritätscheck. */
    dataSha256: string;
  };
}
```

### Row-Schema

Pro Tabelle wird `LocalXxx`-TypeScript-Shape serialisiert. Beispiel `articles.jsonl`:

```json
{"id":"…","originalUrl":"https://…","title":"…","content":"…","status":"unread","savedAt":"…",…}
{"id":"…","originalUrl":"…","title":"…",…}
```

Felder die im ENCRYPTION_REGISTRY stehen **und** in der Quelldatei
verschlüsselt waren, werden beim Export entschlüsselt → plaintext in
der jsonl.

## Export-Pipeline

```
Client:
  1. User-Input: appIds[] + optional passphrase
  2. Sammel-Schleife:
     for appId in selected:
       for table in MODULE_CONFIGS[appId].tables:
         rows = scopedForModule(...).toArray()
         decrypted = decryptRecords(table, rows)
         jsonl += decrypted.map(toSerializable).join('\n')
  3. Manifest bauen (rowCounts, exportedAt, userId, scope, schemaVersion)
  4. Zip-Struktur schnüren (manifest.json + data/*.jsonl + README.md)
  5. Wenn passphrase:
     - data/ in-memory konkatenieren (dataBytes)
     - sha256 = hash(dataBytes)
     - kdfSalt = random(16), iv = random(12)
     - wrappedKey = PBKDF2(passphrase, salt, 600k, 32B)
     - ciphertext = AES-GCM-encrypt(wrappedKey, iv, dataBytes)
     - Manifest.passphrase = { …salt, …iv, dataSha256 }
     - Zip enthält `data.enc` statt `data/`-Ordner
     - Ciphertext-Prüfsumme (AEAD-Tag) ist implizit
  6. Return Blob → Browser-Download
```

## Import-Pipeline

```
Client:
  1. User-Input: File + optional passphrase-prompt
  2. parseBackupV2(file) → { manifest, data or sealedData }
  3. Manifest-Validierung:
     - formatVersion === 2
     - schemaVersion kompatibel (max 2 Versions Rückstand)
     - scope-Struktur valide
  4. Wenn passphrase:
     - User-prompt für Passphrase
     - KDF: PBKDF2(passphrase, salt, iterations, 32B)
     - Decrypt AES-GCM → dataBytes
     - sha256(dataBytes) === manifest.passphrase.dataSha256 ? sonst FAIL
  5. Pro jsonl-Datei in data/:
     - Parse Zeilen zu Row-Objekten
     - Field-by-field: wenn Feldname in ENCRYPTION_REGISTRY[table].fields
       → encryptRecord(row) mit aktuellem Master-Key
     - bulkPut(table, rows) in Dexie
     - Dexie-Creating-Hook stempelt userId, timestamps, tracks pending_changes
       → Sync zum Server läuft automatisch an
  6. Progress-Callback pro Tabelle
  7. Done
```

## File-Struktur

```
apps/mana/apps/web/src/lib/data/backup/
├── v2/
│   ├── format.ts            Types + Zip-Reader/Writer + sha256
│   ├── passphrase.ts        PBKDF2-KDF + AES-GCM-AEAD wrap/unwrap
│   ├── schema.ts            Pro-Tabelle-Row-Serialisation (toJson/fromJson)
│   ├── export.ts            buildClientBackup({ appIds, passphrase })
│   ├── import.ts            applyClientBackup(file, { passphrase })
│   └── format.test.ts       Round-trip-Tests (encrypted + plaintext)
└── (v1/ wird gelöscht)
```

**Kein shared-Parser mit v1**. v1 ist Event-Stream, v2 ist Row-Snapshot
— unterschiedliche Semantik. Besser komplett separat halten.

## UI

Settings → My Data → **„Export & Import"** Panel (ersetzt bisherige
„Backup"-Sektion):

```
┌────────────────────────────────────────────────────┐
│ Export & Import                                     │
│                                                     │
│ Lade deine Mana-Daten als portable .mana-Datei herunter.│
│                                                     │
│ Module wählen                                       │
│  [✓] Alles                                          │
│    ─── oder einzeln ───                             │
│  [ ] Artikel    [ ] Notizen    [ ] Kalender  …      │
│                                                     │
│ [○] Mit Passphrase verschlüsseln                    │
│     ┌──────────────────────┐                        │
│     │ Passphrase           │                        │
│     └──────────────────────┘                        │
│     ┌──────────────────────┐                        │
│     │ Bestätigen           │                        │
│     └──────────────────────┘                        │
│                                                     │
│ [ Exportieren ]                                     │
│                                                     │
│ ─────────────────────────                           │
│                                                     │
│ Import: .mana-Datei wählen  [ Datei wählen ]        │
│                                                     │
└────────────────────────────────────────────────────┘
```

Import-Ablauf:
1. File-Picker — akzeptiert nur `*.mana`
2. Parser liest Manifest
3. Wenn `passphrase` gesetzt → Modal prompts user
4. Progress-Bar mit Tabelle-für-Tabelle-Updates
5. Success-Toast mit Summary („142 Artikel, 48 Highlights, 23 Tags
   importiert")

## Milestones

1. **M1 — Format + Crypto-Primitive**
   - `v2/format.ts`: Manifest-Types, Zip read/write (re-use v1's pako-
     basierten Zip-Code, aber eigene Manifest-Struktur), sha256-Helper
   - `v2/passphrase.ts`: PBKDF2-KDF + AES-GCM wrap/unwrap, 100% Web-
     Crypto, keine neuen Deps
   - `v2/schema.ts`: serialize/deserialize-Helpers pro bekannter Tabelle
   - Unit-Tests für Passphrase-Round-Trip + Zip-Round-Trip
2. **M2 — Export-Builder**
   - `v2/export.ts`: `buildClientBackup({ appIds?, passphrase? }): Promise<Blob>`
   - Iteriert `MODULE_CONFIGS`, nutzt `decryptRecords()`, schreibt jsonl
   - Manifest baut `rowCounts` live
3. **M3 — Import-Pipeline**
   - `v2/import.ts`: `applyClientBackup(file: Blob, opts): Promise<ImportResult>`
   - Re-encrypt via `encryptRecord()`, `bulkPut` in Dexie
   - Progress-Callback, strukturierte Fehler
4. **M4 — UI**
   - `MyDataSection.svelte` — alte Backup-Buttons raus, neue Export-&-Import-Karte rein
   - Modul-Multi-Select, Passphrase-Toggle, Progress-Bar, File-Picker
5. **M5 — Legacy-Cleanup**
   - `services/mana-sync/` — `/backup/export` Go-Handler raus
   - `apps/mana/apps/web/src/lib/api/services/backup.ts` — raus
   - `lib/data/backup/format.ts`, `import.ts`, `format.test.ts` — raus
   - Tests + Docs durchkämmen, alte Referenzen purgen

## Offene Fragen

- **Schema-Version-Kompat-Policy**: Einseitig rückwärts (neuer Import
  liest ältere Exports) ist nötig. Frage: ab wann muss der Import
  hart fehlen? Vorschlag: `schemaVersion < (currentSchema - 2)` →
  Fehler mit Upgrade-Hinweis. In zwei Versionen kann genug Migration
  nötig sein dass Auto-Migration riskant wird.
- **Passphrase-Stärke-Indikator**: Frontend-seitig zxcvbn-ish-Hinweis
  oder minimum-length? Pragmatisch: min 12 Zeichen, keine weitere
  Validierung — User ist Erwachsen.
- **Conflict-Handling beim Import**: Wenn ein Row mit derselben `id`
  schon existiert — überschreiben oder skip? Vorschlag: **überschreiben**
  (simpler, passt zu LWW-Semantik). UI könnte „Dry-Run mit Diff" als
  Phase-2-Feature kriegen.
- **Binäre Daten** (uploaded files, images): Phase 1 exportiert nur
  Metadaten. Blob-Bodies leben in MinIO/Storage, nicht in Dexie. Wenn
  Binary-Export kommt, wird der Manifest-Eintrag `binaryAssets: []`
  ergänzt und die Files in `blobs/`-Unterordner gepackt.
- **Memory**: bei sehr großen Datensätzen streamed man idealerweise.
  Erste Iteration: alles in-memory bauen. Reicht für realistische
  Haushaltsgrößen (10k Artikel + Highlights + Tags ≈ 20 MB JSON).
  Streaming kommt wenn's wirklich nötig wird.
