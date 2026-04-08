# Backlog: File-Bytes Encryption (a.k.a. Phase 10 / Backlog #4b)

> **Status:** Deferred — not blocking, no production code currently uses the path.
> **When to revisit:** When the in-app upload/generate UIs land (see backlog #3+4 from `DATA_LAYER_AUDIT.md`) OR when a compliance/threat-model requirement demands it.
> **Authored:** 2026-04-08, while the rest of Phase 9 was fresh in mind.
> **Reading time:** 15 minutes.

---

## TL;DR

After Phase 9 + the backlog sweep, the **filename metadata** of `storage.files` and the **prompts** of `picture.images` are encrypted at rest in IndexedDB. The actual file/image **bytes on S3** (MinIO in our case) are still plaintext — anyone with bucket access reads the content directly.

This document is the implementation plan for closing that last gap. It's deliberately deferred because:

1. There is no in-app upload UI in the unified Mana web app yet — the current write surface for `storage.files` is a stub. No production user is currently affected.
2. The work is **architecturally heavy** (5 of the 6 hard parts below have no equivalent in the existing field-encryption layer).
3. The trade-offs (no server-side thumbnails, slower seeks, more complex sharing) need real use-cases to prioritise against.

Pick this up when (a) the upload UI is being built — natural integration point, no migration needed — or (b) a real compliance requirement forces it.

---

## Goal

Encrypt the bytes of every `storage.files` and `picture.images` blob client-side so that the storage backend (S3 / MinIO / future provider) holds only ciphertext. After this lands, the server cannot reconstruct file content even with full DB + bucket access. Combined with **Zero-Knowledge mode** from Phase 9, this gets us to "Mana is computationally incapable of reading a user's files" — the strongest local-first storage trust model that's still buildable in a browser.

**Non-goals:**

- We are NOT trying to defeat a malicious browser extension that can read process memory. Web Crypto's non-extractable keys help, but a determined attacker on the user's machine wins regardless.
- We are NOT trying to be perfectly compatible with the existing plaintext storage flow. Migration is one-way: once enabled per-user, new uploads are encrypted, old uploads can be migrated in a background job.
- We are NOT building random-access seeking (video scrubbing, range-requests on encrypted blobs) in the first version. That comes later if needed.

---

## Threat model delta

| Threat                                                  | Pre-Phase-10                                                                 | Post-Phase-10                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Malicious S3 bucket admin reading files                 | ❌ Wins                                                                      | ✅ Sees ciphertext only                                                 |
| Cloud provider compromise (AWS/Hetzner SSO)             | ❌ Wins                                                                      | ✅ Sees ciphertext only                                                 |
| Court order against the storage provider                | ❌ Could be compelled                                                        | ✅ Plaintext does not exist                                             |
| Mana operator with full DB access (standard mode)       | ❌ Wins (can KEK-unwrap MK, then download + decrypt)                         | ⚠️ Same — still wins, the KEK lets them decrypt the wrapped content key |
| Mana operator with full DB access (zero-knowledge mode) | ⚠️ Sees file bytes but not content                                           | ✅ Sees nothing without recovery code                                   |
| User loses recovery code (zero-knowledge mode)          | Files unreadable, but bytes recoverable from S3 if Mana ever switches off ZK | ❌ Files truly lost (no recoverable plaintext anywhere)                 |

The biggest win is in **zero-knowledge mode** — pre-Phase-10, even a ZK user has plaintext file bytes sitting on S3 that the provider could read. Phase 10 closes that asymmetry.

---

## Architecture: Write Path

```
Client (Browser)                                  S3 / mana-media
─────────────────                                 ─────────────────

1. User selects a file (e.g. 10 MB image)
        │
        ▼
2. Generate per-file content key (CK)
   ─ crypto.subtle.generateKey({ AES-GCM, 256 }, true, [enc, dec])
   ─ Fresh CSPRNG, never reused
        │
        ▼
3. Wrap CK with the user's master key (MK)
   ─ exportKey('raw', CK) → 32 bytes
   ─ wrapValue(rawCK, MK) → enc:1:<iv>.<ct>
   ─ Wipe rawCK from memory after wrap
        │
        ▼
4. Stream the file through chunked AES-GCM:
   for chunk in file.stream(CHUNK_SIZE = 1 MB):
     ivChunk = randomBytes(12)
     ct = AES-GCM-encrypt(chunk, CK, ivChunk)
     emit { ivChunk, ct, isLast }
        │
        ▼
5. Multipart upload to S3:
   each (ivChunk || ct) becomes one part.       ──────►   PUT /file/{id}/part/{n}
   The IV is prefixed inline so the reader              (ciphertext bytes)
   knows where each chunk's IV is.
        │
        ▼
6. After all parts complete, write the
   files row to IndexedDB:
   {
     id, name, originalName,                ← already encrypted (Phase 8)
     storageKey,                            ← S3 key, plaintext (routing)
     mimeType, size,                        ← plaintext (UI rendering)
     wrappedContentKey: enc:1:<iv>.<ct>,    ← NEW: Phase 10 envelope
     contentChunkSize: 1048576,             ← NEW: needed for re-stream
     contentEncFormat: 'aes-gcm-chunked-v1' ← NEW: format-version tag
   }
```

Notes:

- **Per-file content key** (not master-key-direct) means rotating the user's master key only requires re-wrapping the small `wrappedContentKey` field for each row, NOT re-encrypting the bytes on S3. Same trick the Phase 2 vault uses for the user MK ↔ KEK relationship. Cheap rotation = makes recovery scenarios actually feasible.
- **AES-GCM per chunk** (not one big AES-GCM call) because Web Crypto's `encrypt`/`decrypt` only accept a single buffer. Streaming AES-GCM in the browser is a self-built wrapper, not an API.
- **Inline IVs** in the chunk payload (vs. a separate manifest) means each part is self-describing — no second round-trip to fetch a header before starting decryption. The cost is 12 bytes overhead per chunk = 0.0012% for 1 MB chunks.
- **Auth tag per chunk** means tampering anywhere in a chunk fails-loud. The tag is 16 bytes per chunk, baked into the AES-GCM ciphertext output.

## Architecture: Read Path

```
1. UI requests file (download / preview)
        │
        ▼
2. Read the files row from IndexedDB
   ─ get wrappedContentKey + contentChunkSize + contentEncFormat
        │
        ▼
3. Unwrap CK with the master key (in browser)
   ─ unwrapValue(wrappedContentKey, MK) → rawCK
   ─ importKey('raw', rawCK, AES-GCM, false, [decrypt])
   ─ Wipe rawCK from memory
        │
        ▼
4. Stream the S3 object via fetch() with ReadableStream
        │
        ▼
5. Pipe through a TransformStream that:
   for each (ivChunk || ct):
     plain = AES-GCM-decrypt(ct, CK, ivChunk)
     emit plain
        │
        ▼
6. Sink:
   ─ Image: createImageBitmap(blob) → <img src=blob:...>
   ─ Video: MediaSource + appendBuffer per chunk
   ─ Download: ReadableStream → File-System-Access API
   ─ Generic: Blob → URL.createObjectURL → <a download>
```

The ReadableStream / TransformStream pipeline lets the browser start rendering before the full file is downloaded — important for image previews on slow connections.

---

## The six hard parts

### 1. Web Crypto AES-GCM doesn't stream

`crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)` accepts a single `BufferSource` and returns a single ciphertext buffer with the auth tag appended. There is no `update(chunk)` / `final()` API the way Node's `crypto` has.

**Implication:** the "streaming AES-GCM" we'd build is actually **a sequence of independent AES-GCM operations**, one per chunk, each with its own IV and its own auth tag. This is sometimes called "chunked AEAD". It's less efficient than true streaming AEAD (CTR mode + a separate authenticator over the whole file) but it has two big upsides:

- Per-chunk failure-loud: tampering any chunk fails just that chunk's decrypt, not the whole file.
- Resumable: you can stop and restart at any chunk boundary.

The chunk size is a tuning knob. 1 MB is a good default — small enough that a single chunk decrypt is sub-100ms even on a slow phone, large enough that the per-chunk overhead (12 IV + 16 tag = 28 bytes) is negligible.

### 2. Multipart uploads need coordinated chunking

S3 multipart uploads have a **5 MB minimum part size** (except the last part). Our 1 MB AES-GCM chunks are smaller than that. Solution: each S3 part wraps **multiple AES-GCM chunks**:

```
S3 Part 1 (5 MB): chunk0 || chunk1 || chunk2 || chunk3 || chunk4   (5x 1 MB)
S3 Part 2 (5 MB): chunk5 || chunk6 || chunk7 || chunk8 || chunk9
S3 Part 3 (variable, last): chunk10 || partial
```

The reader uses `contentChunkSize` to find chunk boundaries inside each downloaded byte range. This is bookkeeping but not hard.

Alternative: use a different storage backend protocol that allows smaller parts (e.g. Cloudflare R2 has lower minimums). Not worth optimising for if MinIO is the primary target.

### 3. Resumable uploads + key persistence

If the user uploads a 500 MB file and the connection drops at chunk 200 of 500, retrying from chunk 0 is unacceptable. The standard fix is **resumable multipart uploads** — S3 lets you re-upload individual missing parts using the same `uploadId`.

The complication for us: the **content key** is generated client-side and only lives in browser memory during the upload. If the user closes the tab between chunks 200 and 201, the key is gone and the upload is unrecoverable.

**Fix:** persist the in-progress upload state to IndexedDB:

```ts
interface PendingUpload {
	id: string; // local UUID
	fileId: string; // target files row
	uploadId: string; // S3 multipart upload id
	storageKey: string;
	totalChunks: number;
	uploadedParts: { partNumber: number; etag: string }[];
	// The content key, wrapped with the master key the same way
	// it'll be wrapped on the final files row. Lets us resume after
	// a tab close as long as the user is still authenticated.
	wrappedContentKey: string;
	contentKeyIv: string;
	startedAt: string;
}
```

This row lives in a new `_pendingUploads` table (system table, not synced). On boot, the upload manager scans for incomplete entries and offers a "resume" UI.

### 4. No more server-side thumbnails

`mana-media` currently generates thumbnails (multiple resolutions) for uploaded images by reading the original from S3, running `sharp`/`vips`, and writing the resized variants back. **This stops working** once the bytes are encrypted — the server has no key.

Three options:

1. **Client generates thumbnails before upload.** The upload flow becomes: pick file → resize via canvas → encrypt + upload original AND each resolution variant. More client work, more uploads, but full zero-knowledge.

2. **Drop thumbnails entirely.** Display the full-resolution image inline. Acceptable for <2 MB images but kills UX for 10 MB+ files.

3. **"Public preview layer".** Generate one tiny low-resolution preview (e.g. 200x200, 20 KB) that's NOT encrypted, store it as a separate S3 object alongside the encrypted full-res. The preview is intentionally world-visible if anyone gets the URL — the user is told this in the upload flow. Originally encrypted, full-res, lives behind the per-file content key.

Recommended: **option 1** for v1, with **option 3** as a future toggle for users who want fast browsing UX more than they care about preview privacy.

### 5. Sharing complicates the trust model

Today: a shared file is a public S3 URL. Anyone with the link reads the bytes. Simple but boring.

After Phase 10: the S3 bytes are ciphertext. To let someone else read them, they need both the URL AND the content key. Three viable approaches:

1. **"Share link with embedded key fragment".** The shareable URL is `https://mana.how/share/{token}#key={base64-CK}`. The key lives in the URL fragment, which (a) never goes to the server (browsers don't send fragments in HTTP requests), (b) survives copy/paste, (c) makes the share link self-contained. The recipient's browser parses the fragment, decrypts in-page, renders. **Same trust model as Mega.nz / Cryptpad.** Compromised network + intercepted URL = full file access, but that was already true with public S3 URLs.

2. **Server-mediated re-encrypt.** The user calls a "share with X" endpoint. The server temporarily holds the receiver's public key (X25519), the original user's client downloads + decrypts the file, re-encrypts under the receiver's pubkey, uploads the re-encrypted version. Receiver decrypts with their private key. Strongest threat model but **incompatible with zero-knowledge mode** because the original user has to do all the work in-browser, and breaks if either party is offline.

3. **Don't share encrypted files.** Only public-bytes files can be shared via URL. Encrypted files have to be exported + sent via another channel. Simplest, worst UX.

Recommended: **option 1** for the first version, with a clear UI warning that share links are sensitive. Option 2 is a "Phase 11" if users actually ask for it.

### 6. Migration of existing plaintext files

When Phase 10 ships and a user enables it (or it's enabled by default for new accounts), all their **existing** S3 objects are still plaintext. Two migration paths:

1. **Background re-encrypt job.** A daemon walks the user's `files` table, for each row: download from S3, encrypt locally, upload to a new key, update the row, delete the old object. Slow (constrained by upload bandwidth) and risky (network failure mid-job leaves orphans). Several hours for typical accounts; days for power users with many GB.

2. **Lazy migration.** Tag every existing row with `contentEncFormat: 'plaintext-v0'`. On next read, the client streams it down, encrypts, uploads to a new key, and updates the row. Spreads the cost over actual usage but means a long tail of plaintext objects sit on S3 until the user happens to view them.

3. **Just-in-time at switchover.** When the user toggles "Enable file encryption", run the full re-encrypt job in the foreground with a progress bar. The user is blocked from new uploads until it finishes. Honest but painful.

Recommended: **lazy migration** (#2) for the first version. The "long tail" complaint is real but the alternative is a multi-hour blocking job that users will abandon.

For users in **zero-knowledge mode at the time of Phase 10 ship**, the right default is probably to migrate-on-read — they already accepted long-running operations as part of the ZK setup, and the bytes are the last gap in their threat model.

---

## Schema delta

```sql
-- Migration: services/mana-auth/sql/004_file_content_keys.sql
--
-- Phase 10 — file-bytes encryption support. Adds three columns to
-- the files table for the per-file content key envelope and the
-- format version tag. Existing rows default to 'plaintext-v0' so
-- the lazy-migration path can find them.

-- The files table is currently in the unified Dexie schema only —
-- if mana-sync ever materialises a server-side mirror, this
-- migration would need to be applied there too.

ALTER TABLE files
    ADD COLUMN IF NOT EXISTS wrapped_content_key TEXT,
    ADD COLUMN IF NOT EXISTS content_key_iv      TEXT,
    ADD COLUMN IF NOT EXISTS content_chunk_size  INTEGER NOT NULL DEFAULT 1048576,
    ADD COLUMN IF NOT EXISTS content_enc_format  TEXT NOT NULL DEFAULT 'plaintext-v0';

-- Same shape on images:
ALTER TABLE images
    ADD COLUMN IF NOT EXISTS wrapped_content_key TEXT,
    ADD COLUMN IF NOT EXISTS content_key_iv      TEXT,
    ADD COLUMN IF NOT EXISTS content_chunk_size  INTEGER NOT NULL DEFAULT 1048576,
    ADD COLUMN IF NOT EXISTS content_enc_format  TEXT NOT NULL DEFAULT 'plaintext-v0';
```

In the Dexie schema:

```ts
// database.ts — add the three new columns to the files + images
// version block. NO new index needed; the lookup is always by id.
files: 'id, parentFolderId, mimeType, isFavorite, isDeleted, name, contentEncFormat',
images: 'id, isFavorite, isPublic, isArchived, prompt, updatedAt, contentEncFormat',
```

The `contentEncFormat` index is the only addition — lets the lazy migration job find `plaintext-v0` rows efficiently.

---

## File map

New files to create:

| Path                                                               | Role                                                                                                                                                            | Approx LoC      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `apps/mana/apps/web/src/lib/data/crypto/file-stream.ts`            | Chunked AES-GCM streaming wrap/unwrap. Pure crypto, no Dexie.                                                                                                   | ~400            |
| `apps/mana/apps/web/src/lib/data/crypto/file-stream.test.ts`       | Roundtrip tests, tampering detection, multi-chunk boundaries, partial-chunk last block.                                                                         | ~300            |
| `apps/mana/apps/web/src/lib/data/crypto/content-key.ts`            | Per-file content key generation + wrap/unwrap with master key.                                                                                                  | ~120            |
| `apps/mana/apps/web/src/lib/data/crypto/content-key.test.ts`       |                                                                                                                                                                 | ~150            |
| `apps/mana/apps/web/src/lib/modules/storage/upload-encrypted.ts`   | High-level uploader: takes a `File`, manages multipart + chunking + content-key wrap, writes the final row.                                                     | ~350            |
| `apps/mana/apps/web/src/lib/modules/storage/download-encrypted.ts` | High-level downloader: takes a files row, streams S3, decrypts, returns a Blob/ReadableStream.                                                                  | ~250            |
| `apps/mana/apps/web/src/lib/modules/storage/migration-lazy.ts`     | The "encrypt-on-read" migration helper. Hooks into download-encrypted's plaintext branch.                                                                       | ~150            |
| `apps/mana/apps/web/src/lib/modules/storage/_pendingUploads.ts`    | Resumable upload state table + scanner                                                                                                                          | ~200            |
| `services/mana-media/src/encrypted-blob-handler.ts`                | Server-side: accept opaque ciphertext blobs, do NOT try to thumbnail. Replace the existing thumbnail middleware path for `contentEncFormat !== 'plaintext-v0'`. | ~100            |
| `apps/docs/src/content/docs/architecture/security.mdx`             | Update the security page with the new file-bytes section + threat model table delta.                                                                            | ~80 lines added |

Existing files to touch:

| Path                                                                 | What                                                                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/mana/apps/web/src/lib/data/crypto/registry.ts`                 | Add comment that `files` and `images` now have a content-key envelope path that's separate from the field-encryption registry.                   |
| `apps/mana/apps/web/src/lib/modules/storage/stores/files.svelte.ts`  | The existing `insert()` helper from backlog #3+4 grows a content-key envelope path. Plaintext path stays for backwards compat (and for opt-out). |
| `apps/mana/apps/web/src/lib/modules/picture/stores/images.svelte.ts` | Same as files.                                                                                                                                   |

Total estimate: ~2200 LoC of new code, ~150 LoC of changes to existing files. Comparable to the entire Phase 9 sweep.

---

## Testing strategy

| Layer                   | Test type          | What                                                                                                                                                                                                                                   |
| ----------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `file-stream.ts`        | Unit (vitest)      | Single chunk roundtrip, multi-chunk roundtrip, partial last chunk, tamper-each-byte, wrong key, wrong IV, replay attack (same chunk twice), 0-byte file, 1-byte file, 100 MB file (memory), zero-content key, end-of-stream truncation |
| `content-key.ts`        | Unit (vitest)      | Generate-wrap-unwrap roundtrip, wrong MK fails, master key rotation invalidates old wrap                                                                                                                                               |
| `upload-encrypted.ts`   | Unit + integration | Mock S3 client, verify part boundaries, verify resume picks up where it left off, verify the files row matches the in-flight state                                                                                                     |
| `download-encrypted.ts` | Unit + integration | Range request handling, partial download recovery, ReadableStream interruption                                                                                                                                                         |
| `migration-lazy.ts`     | Integration        | plaintext-v0 row gets re-encrypted on first read, second read goes through the new path without re-migrating                                                                                                                           |
| End-to-end              | Playwright         | Upload → reload page → resume → download → byte-equal-to-original                                                                                                                                                                      |

Target: 100% coverage on the crypto primitives (file-stream + content-key), 80%+ on the upload/download orchestration, smoke-level for the UI integration.

---

## Out of scope (explicitly)

These are tempting but should NOT be in the v1:

- **Random-access seeking** (video scrubbing). Hard, needs CTR + separate auth, doubles the format complexity.
- **Per-share access control lists.** Just URL-fragment sharing for v1.
- **Server-side search inside encrypted file content** (e.g. "find PDFs containing X"). Requires either client-side full-text indexing into IndexedDB OR searchable encryption schemes. Both are big projects.
- **Versioning of encrypted blobs.** Just overwrite-on-update for v1; if a user wants version history, that's a separate feature on top.
- **Client-side virus scanning.** The server can't scan ciphertext. Either accept the risk or do it client-side before encryption (heavyweight).
- **Per-file decryption audit log.** Possible but adds privacy concerns of its own (what if the audit log itself becomes a target?).

---

## Decision criteria for "do this now"

Go ahead with Phase 10 when ANY of these is true:

1. **The unified Mana web app gains an in-app upload UI.** This is the natural integration point — encryption is built in from day one, no plaintext history to migrate. Watch for: file-picker button somewhere in the storage module, drag-and-drop zone, mobile camera capture flow.

2. **A real compliance requirement lands.** HIPAA-grade health data, EU Schrems II decision impact, Swiss nDSG client request, etc. The KEK trust model is borderline for some of these; client-side bytes-encryption clears it.

3. **A user asks "why are my photos visible to your team?"** The current honest answer is "they aren't, the field encryption hides the prompts and metadata, but yes the actual bytes are on S3 in plaintext". When that answer becomes uncomfortable, that's the signal.

4. **Picture / image-gen becomes a flagship module.** Right now picture is on the same priority tier as cards or memos. If it becomes the main draw of Mana (or a paid tier), the trust story for the actual generated images becomes user-facing marketing.

Don't do this proactively just because the doc exists. Encryption layers are easier to build right when there's a real user-shaped requirement to push against than when they're abstract.

---

## Open questions for whoever picks this up

These are things I would ask before starting — they don't have obvious answers from where Phase 9 left off:

1. **Does mana-media stay in the loop at all, or does the client upload directly to S3?** Today mana-media is the upload proxy + thumbnail generator. Phase 10 kills the thumbnail role. If mana-media is also the auth-checker for upload URLs, it might still be the path. If not, presigned PUT URLs from the storage backend are simpler.

2. **What's the chunk size sweet spot in real use?** 1 MB is a guess. Real numbers from a benchmark on a slow Android phone would inform this — too small means too many auth tags (overhead), too big means each decrypt blocks the main thread.

3. **Does the lazy migration ever finish?** If users keep uploading new plaintext files (because the toggle isn't on by default), the long tail never converges. The migration path needs a clear "you have N old files, click here to migrate them all in the background" entry point in settings.

4. **How does zero-knowledge mode interact with image generation?** The image-gen API needs the plaintext prompt to call the AI provider. The bytes that come back need to be encrypted client-side before storage. This means the generation flow looks like: client posts plaintext prompt → server calls AI → server returns plaintext bytes → client encrypts → client uploads. The server briefly sees both the prompt AND the bytes. For a true ZK story, the AI call would need to round-trip through the client too (which is impractical for API-keyed providers like OpenAI).

5. **Sharing links and zero-knowledge mode** — does a ZK user have a "share" feature at all? Option 1 (URL fragment) works for ZK because the key never touches Mana. But the user has to be aware that sharing intentionally weakens their privacy posture.

---

## Cross-references

- `DATA_LAYER_AUDIT.md` Section 6 lists this as Backlog #1 (open). When Phase 10 ships, move it to "Abgeschlossen" with the implementation commits.
- `apps/docs/src/content/docs/architecture/security.mdx` will need a new H2 section once this is built — the current doc explicitly says "filename metadata only" for the storage carve-out.
- `apps/mana/apps/web/src/lib/modules/picture/stores/images.svelte.ts` has the `imagesStore.insert()` helper from backlog #3+4 which becomes the natural call site for Phase 10's content-key-aware path.
- `apps/mana/apps/web/src/lib/modules/storage/stores/files.svelte.ts` same thing for files.
- The `recovery.ts` HKDF pattern from Phase 9 is the closest thing in the codebase to what `content-key.ts` will look like — same envelope shape, same wipe-after-use discipline.

---

**End of plan.** Estimated session count from cold start to "shipped + tested": **3–5 focused sessions**, depending on how much of the lazy migration + sharing UX gets included in v1.
