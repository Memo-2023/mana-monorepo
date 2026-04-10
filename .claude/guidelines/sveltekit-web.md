# SvelteKit Web Guidelines

## Overview

All web applications use **SvelteKit 2** with **Svelte 5** in runes mode. This guide covers component patterns, state management, routing, and API integration.

## Project Structure

```
apps/{project}/apps/web/
├── src/
│   ├── app.html              # HTML template
│   ├── app.css               # Global styles (Tailwind)
│   ├── app.d.ts              # Type declarations
│   ├── hooks.server.ts       # Server hooks (auth)
│   ├── lib/
│   │   ├── components/       # Reusable components
│   │   │   ├── ui/           # Generic UI components
│   │   │   └── {feature}/    # Feature-specific components
│   │   ├── stores/           # Svelte 5 stores (.svelte.ts)
│   │   ├── api/              # API client
│   │   ├── utils/            # Utilities
│   │   └── types/            # TypeScript types
│   └── routes/
│       ├── +layout.svelte    # Root layout
│       ├── +page.svelte      # Home page
│       ├── (auth)/           # Auth route group
│       │   ├── login/
│       │   └── register/
│       └── (protected)/      # Protected route group
│           ├── +layout.svelte
│           ├── files/
│           └── settings/
├── static/                   # Static assets
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Svelte 5 Runes

### State with $state

```svelte
<script lang="ts">
	// Reactive state
	let count = $state(0);
	let name = $state('');
	let items = $state<string[]>([]);

	// Object state
	let user = $state<User | null>(null);

	// Functions that modify state
	function increment() {
		count++; // Direct mutation works
	}

	function addItem(item: string) {
		items = [...items, item]; // Or reassignment
	}
</script>
```

### Derived Values with $derived

**CRITICAL: `$derived(expr)` vs `$derived.by(fn)`**

- `$derived(expression)` — takes a **single expression**. The value IS the expression result.
- `$derived.by(() => { ... return value; })` — takes a **function** (thunk). Use this when you need `if`/`switch`/`for` or multiple statements.

**Common mistake:** writing `$derived(() => { ... })` — this stores the arrow function itself as the value, not its return value. Every `{#if myDerived}` will be truthy (functions are always truthy), and `myDerived()` will fail with "not callable" at the type level.

```svelte
<script lang="ts">
	let count = $state(0);
	let items = $state<Item[]>([]);

	// ✅ Single expression → $derived
	const doubled = $derived(count * 2);
	const itemCount = $derived(items.length);
	const hasItems = $derived(items.length > 0);
	const sortedItems = $derived([...items].sort((a, b) => a.name.localeCompare(b.name)));

	// ✅ Ternary is still a single expression
	const displayText = $derived(
		count === 0 ? 'No items' : count === 1 ? '1 item' : `${count} items`
	);

	// ✅ Multi-statement logic → $derived.by
	const filteredItems = $derived.by(() => {
		if (!searchQuery.trim()) return items;
		const q = searchQuery.toLowerCase();
		return items.filter((i) => i.name.toLowerCase().includes(q));
	});

	// ❌ WRONG — stores the function, not the result!
	// const filteredItems = $derived(() => { ... });
</script>
```

### Effects with $effect

```svelte
<script lang="ts">
	import { browser } from '$app/environment';

	let searchQuery = $state('');
	let results = $state<SearchResult[]>([]);

	// Run effect when dependencies change
	$effect(() => {
		if (!browser) return;

		// This runs when searchQuery changes
		const timer = setTimeout(async () => {
			results = await search(searchQuery);
		}, 300);

		// Cleanup function
		return () => clearTimeout(timer);
	});

	// Effect for initialization
	$effect(() => {
		if (browser) {
			loadInitialData();
		}
	});
</script>
```

### Props with $props

```svelte
<script lang="ts">
	import type { File } from '$lib/types';

	// Define props with types
	interface Props {
		file: File;
		selected?: boolean;
		onDelete?: (id: string) => void;
		onSelect?: (file: File) => void;
	}

	// Destructure with defaults
	let { file, selected = false, onDelete, onSelect }: Props = $props();

	function handleDelete() {
		onDelete?.(file.id);
	}
</script>

<div class:selected onclick={() => onSelect?.(file)}>
	<span>{file.name}</span>
	{#if onDelete}
		<button onclick={handleDelete}>Delete</button>
	{/if}
</div>
```

### Bindable Props with $bindable

```svelte
<script lang="ts">
	interface Props {
		value: string;
		disabled?: boolean;
	}

	let { value = $bindable(), disabled = false }: Props = $props();
</script>

<input bind:value {disabled} />

<!-- Usage: -->
<!-- <TextInput bind:value={searchQuery} /> -->
```

## Stores (Svelte 5 Pattern)

### Store File (.svelte.ts)

```typescript
// src/lib/stores/files.svelte.ts
import { browser } from '$app/environment';
import { api } from '$lib/api/client';
import type { File, AppError } from '$lib/types';

// Private state
let files = $state<File[]>([]);
let loading = $state(false);
let error = $state<AppError | null>(null);
let selectedId = $state<string | null>(null);

// Derived values
const selectedFile = $derived(files.find((f) => f.id === selectedId) ?? null);

const fileCount = $derived(files.length);

// Actions
async function loadFiles(folderId?: string): Promise<void> {
	if (!browser) return;

	loading = true;
	error = null;

	const result = await api.files.list(folderId);

	if (result.ok) {
		files = result.data;
	} else {
		error = result.error;
	}

	loading = false;
}

async function deleteFile(id: string): Promise<boolean> {
	const result = await api.files.delete(id);

	if (result.ok) {
		files = files.filter((f) => f.id !== id);
		if (selectedId === id) selectedId = null;
		return true;
	}

	error = result.error;
	return false;
}

function selectFile(id: string | null): void {
	selectedId = id;
}

function reset(): void {
	files = [];
	loading = false;
	error = null;
	selectedId = null;
}

// Export as object with getters
export const fileStore = {
	// Getters for state
	get files() {
		return files;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get selectedFile() {
		return selectedFile;
	},
	get fileCount() {
		return fileCount;
	},

	// Actions
	loadFiles,
	deleteFile,
	selectFile,
	reset,
};
```

### Using Stores in Components

```svelte
<script lang="ts">
	import { fileStore } from '$lib/stores/files.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		fileStore.loadFiles();
	});

	async function handleDelete(id: string) {
		const success = await fileStore.deleteFile(id);
		if (success) {
			showToast('File deleted');
		}
	}
</script>

{#if fileStore.loading}
	<LoadingSpinner />
{:else if fileStore.error}
	<ErrorMessage message={fileStore.error.message} />
{:else}
	<FileList
		files={fileStore.files}
		selectedId={fileStore.selectedFile?.id}
		onSelect={(file) => fileStore.selectFile(file.id)}
		onDelete={handleDelete}
	/>
{/if}
```

## API Client

```typescript
// src/lib/api/client.ts
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/auth.svelte';
import type { Result, AppError } from '@manacore/shared-errors';
import { ErrorCode } from '@manacore/shared-errors';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

interface ApiResponse<T> {
	ok: boolean;
	data?: T;
	error?: AppError;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<Result<T>> {
	if (!browser) {
		return { ok: false, error: { code: ErrorCode.INTERNAL_ERROR, message: 'SSR not supported' } };
	}

	try {
		const token = authStore.token;

		const response = await fetch(`${PUBLIC_BACKEND_URL}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...options.headers,
			},
		});

		// Handle 401 - redirect to login
		if (response.status === 401) {
			authStore.logout();
			goto('/login');
			return { ok: false, error: { code: ErrorCode.UNAUTHORIZED, message: 'Session expired' } };
		}

		const json: ApiResponse<T> = await response.json();

		if (!json.ok || json.error) {
			return {
				ok: false,
				error: json.error ?? { code: ErrorCode.UNKNOWN_ERROR, message: 'Request failed' },
			};
		}

		return { ok: true, data: json.data as T };
	} catch (error) {
		return {
			ok: false,
			error: { code: ErrorCode.EXTERNAL_SERVICE_ERROR, message: 'Network error' },
		};
	}
}

// Typed API endpoints
export const api = {
	files: {
		list: (folderId?: string) =>
			request<File[]>(`/api/v1/files${folderId ? `?folderId=${folderId}` : ''}`),

		get: (id: string) => request<File>(`/api/v1/files/${id}`),

		create: (data: CreateFileDto) =>
			request<File>('/api/v1/files', {
				method: 'POST',
				body: JSON.stringify(data),
			}),

		update: (id: string, data: UpdateFileDto) =>
			request<File>(`/api/v1/files/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data),
			}),

		delete: (id: string) => request<void>(`/api/v1/files/${id}`, { method: 'DELETE' }),
	},

	folders: {
		list: () => request<Folder[]>('/api/v1/folders'),
		get: (id: string) => request<Folder>(`/api/v1/folders/${id}`),
		create: (data: CreateFolderDto) =>
			request<Folder>('/api/v1/folders', {
				method: 'POST',
				body: JSON.stringify(data),
			}),
	},
};
```

## Routing

### Route Groups

```
src/routes/
├── +layout.svelte          # Root layout (applies to all)
├── +page.svelte            # / (home)
├── (auth)/                 # Auth pages (no sidebar)
│   ├── +layout.svelte      # Auth layout
│   ├── login/+page.svelte
│   └── register/+page.svelte
└── (app)/                  # App pages (with sidebar)
    ├── +layout.svelte      # App layout with auth check
    ├── files/
    │   ├── +page.svelte    # /files
    │   └── [id]/+page.svelte  # /files/:id
    └── settings/+page.svelte
```

### Layout with Auth Check

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';

	let { children } = $props();

	// Check auth on mount
	$effect(() => {
		if (browser && !authStore.isAuthenticated) {
			goto('/login');
		}
	});
</script>

{#if authStore.isAuthenticated}
	<div class="flex h-screen">
		<Sidebar />
		<main class="flex-1 overflow-auto">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="flex items-center justify-center h-screen">
		<LoadingSpinner />
	</div>
{/if}
```

### Dynamic Routes

```svelte
<!-- src/routes/(app)/files/[id]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { api } from '$lib/api/client';

	let file = $state<File | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Load file when ID changes
	$effect(() => {
		const fileId = $page.params.id;
		loadFile(fileId);
	});

	async function loadFile(id: string) {
		loading = true;
		error = null;

		const result = await api.files.get(id);

		if (result.ok) {
			file = result.data;
		} else {
			error = result.error.message;
		}

		loading = false;
	}
</script>

{#if loading}
	<LoadingSpinner />
{:else if error}
	<ErrorMessage message={error} />
{:else if file}
	<FileViewer {file} />
{/if}
```

## Components

### Component Pattern

```svelte
<!-- src/lib/components/files/FileCard.svelte -->
<script lang="ts">
	import type { File } from '$lib/types';
	import { formatBytes, formatDate } from '$lib/utils/format';
	import FileIcon from './FileIcon.svelte';

	interface Props {
		file: File;
		selected?: boolean;
		onSelect?: () => void;
		onDelete?: () => void;
	}

	let { file, selected = false, onSelect, onDelete }: Props = $props();

	const formattedSize = $derived(formatBytes(file.size));
	const formattedDate = $derived(formatDate(file.createdAt));
</script>

<div
	class="p-4 rounded-lg border transition-colors cursor-pointer
         {selected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}"
	onclick={onSelect}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && onSelect?.()}
>
	<div class="flex items-start gap-3">
		<FileIcon mimeType={file.mimeType} />

		<div class="flex-1 min-w-0">
			<h3 class="font-medium truncate">{file.name}</h3>
			<p class="text-sm text-gray-500">
				{formattedSize} • {formattedDate}
			</p>
		</div>

		{#if onDelete}
			<button
				class="p-2 text-gray-400 hover:text-red-500"
				onclick|stopPropagation={onDelete}
				aria-label="Delete file"
			>
				<TrashIcon />
			</button>
		{/if}
	</div>
</div>
```

### Snippets (Slot Replacement)

```svelte
<!-- Parent component -->
<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';

  let showModal = $state(false);
</script>

<Modal bind:open={showModal}>
  {#snippet header()}
    <h2>Confirm Delete</h2>
  {/snippet}

  {#snippet content()}
    <p>Are you sure you want to delete this file?</p>
  {/snippet}

  {#snippet footer()}
    <button onclick={() => showModal = false}>Cancel</button>
    <button onclick={handleDelete}>Delete</button>
  {/snippet}
</Modal>

<!-- Modal.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    header?: Snippet;
    content?: Snippet;
    footer?: Snippet;
  }

  let { open = $bindable(), header, content, footer }: Props = $props();
</script>

{#if open}
  <div class="modal-overlay" onclick={() => open = false}>
    <div class="modal" onclick|stopPropagation>
      {#if header}
        <div class="modal-header">{@render header()}</div>
      {/if}

      {#if content}
        <div class="modal-content">{@render content()}</div>
      {/if}

      {#if footer}
        <div class="modal-footer">{@render footer()}</div>
      {/if}
    </div>
  </div>
{/if}
```

## Styling

### Tailwind Configuration

```javascript
// tailwind.config.js
import sharedConfig from '@manacore/shared-tailwind';

export default {
	presets: [sharedConfig],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			// Project-specific overrides
		},
	},
};
```

### Global Styles

```css
/* src/app.css */
@import 'tailwindcss';
@import '@manacore/shared-tailwind/theme.css';

/* Custom utilities */
@layer utilities {
	.scrollbar-thin {
		scrollbar-width: thin;
	}
}

/* Custom components */
@layer components {
	.btn-primary {
		@apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors;
	}
}
```

## Form Handling

```svelte
<script lang="ts">
	import { api } from '$lib/api/client';

	let name = $state('');
	let email = $state('');
	let loading = $state(false);
	let errors = $state<Record<string, string>>({});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errors = {};

		// Client-side validation
		if (!name.trim()) errors.name = 'Name is required';
		if (!email.trim()) errors.email = 'Email is required';
		if (Object.keys(errors).length > 0) return;

		loading = true;
		const result = await api.users.create({ name, email });
		loading = false;

		if (result.ok) {
			goto('/users');
		} else {
			// Handle server errors
			if (result.error.code === 'ERR_5002') {
				errors.email = 'Email already exists';
			} else {
				errors.form = result.error.message;
			}
		}
	}
</script>

<form onsubmit={handleSubmit}>
	{#if errors.form}
		<div class="text-red-500 mb-4">{errors.form}</div>
	{/if}

	<div class="mb-4">
		<label for="name">Name</label>
		<input id="name" bind:value={name} class:border-red-500={errors.name} />
		{#if errors.name}
			<span class="text-red-500 text-sm">{errors.name}</span>
		{/if}
	</div>

	<div class="mb-4">
		<label for="email">Email</label>
		<input id="email" type="email" bind:value={email} class:border-red-500={errors.email} />
		{#if errors.email}
			<span class="text-red-500 text-sm">{errors.email}</span>
		{/if}
	</div>

	<button type="submit" disabled={loading} class="btn-primary">
		{loading ? 'Saving...' : 'Save'}
	</button>
</form>
```

## Environment Variables

### Build-Time vs Runtime Variables

SvelteKit has **two types** of environment variables:

1. **Build-time** (`$env/static/public`) - Baked into the bundle at build time
2. **Runtime** (`process.env`) - Available at runtime in server code

**CRITICAL**: For Docker deployments, browser-facing URLs must use **runtime injection** because:

- Docker images are built once but deployed to different environments (staging, production)
- Build-time variables would require rebuilding the image for each environment
- The browser cannot access `process.env` - it needs values injected into the HTML

### ❌ WRONG - Hardcoded or Build-Time URLs

```typescript
// ❌ BAD - Hardcoded URL (won't work in Docker)
const MANA_AUTH_URL = 'http://localhost:3001';

// ❌ BAD - Build-time variable (works locally, breaks in Docker)
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';
const MANA_AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// ❌ BAD - import.meta.env is also build-time
const MANA_AUTH_URL = import.meta.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
```

### ✅ CORRECT - Runtime Injection Pattern

**Step 1: Create `hooks.server.ts`** to inject env vars into HTML:

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

// Get client-side URLs from Docker runtime environment
const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_CORE_AUTH_URL || '';
const PUBLIC_BACKEND_URL_CLIENT =
	process.env.PUBLIC_BACKEND_URL_CLIENT || process.env.PUBLIC_BACKEND_URL || '';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			// Inject runtime environment variables into the HTML
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${PUBLIC_MANA_CORE_AUTH_URL_CLIENT}";
window.__PUBLIC_BACKEND_URL__ = "${PUBLIC_BACKEND_URL_CLIENT}";
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});
};
```

**Step 2: Read from `window` in client code:**

```typescript
// src/lib/stores/auth.svelte.ts
import { browser } from '$app/environment';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		// Client-side: use injected window variable
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	// Server-side (SSR): use Docker internal URL
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
}

// Use in auth service initialization
const auth = initializeWebAuth({ baseUrl: getAuthUrl() });
```

**Step 3: Set environment variables in `docker-compose.staging.yml`:**

```yaml
services:
  myapp-web:
    environment:
      # Server-side URLs (Docker internal network)
      PUBLIC_BACKEND_URL: http://myapp-backend:3000
      PUBLIC_MANA_CORE_AUTH_URL: http://mana-core-auth:3001
      # Client-side URLs (browser access via public IP)
      PUBLIC_BACKEND_URL_CLIENT: https://myapp.mana.how:3000
      PUBLIC_MANA_CORE_AUTH_URL_CLIENT: https://myapp.mana.how:3001
```

### Why Two URLs?

| Variable                           | Purpose                           | Example                       |
| ---------------------------------- | --------------------------------- | ----------------------------- |
| `PUBLIC_MANA_CORE_AUTH_URL`        | Server-to-server (SSR, API calls) | `http://mana-core-auth:3001`  |
| `PUBLIC_MANA_CORE_AUTH_URL_CLIENT` | Browser to server                 | `https://myapp.mana.how:3001` |

Docker containers can reach each other by service name (`mana-core-auth`), but browsers need the public IP/domain.

### Apps Using This Pattern Correctly

All web apps with backends now use the runtime injection pattern:

- ✅ `chat/apps/web`
- ✅ `picture/apps/web`
- ✅ `zitare/apps/web`
- ✅ `contacts/apps/web`
- ✅ `calendar/apps/web`
- ✅ `clock/apps/web`
- ✅ `todo/apps/web`

### Apps That May Need Fixing

- ❓ `cards/apps/web` - Check if using dynamic URLs
- ❓ `manacore/apps/web` - Check if using dynamic URLs

### Quick Checklist for New SvelteKit Apps

- [ ] Create `src/hooks.server.ts` with env injection
- [ ] Update `auth.svelte.ts` to use `getAuthUrl()` pattern
- [ ] Update `user-settings.svelte.ts` to use `getAuthUrl()` pattern
- [ ] Update any feedback services to use runtime URL
- [ ] Add both `_CLIENT` and non-client env vars to `docker-compose.staging.yml`
- [ ] Never hardcode `localhost:3001` anywhere

### Simple .env (for local development only)

```env
PUBLIC_BACKEND_URL=http://localhost:3016
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

These work locally because both the browser and server access `localhost`.

## Anti-Patterns to Avoid

### Don't Use Old Svelte Syntax

```svelte
<!-- BAD - Old Svelte 4 syntax -->
<script>
  let count = 0;
  $: doubled = count * 2;
  $: console.log(count);
</script>

<!-- GOOD - Svelte 5 runes -->
<script>
  let count = $state(0);
  const doubled = $derived(count * 2);
  $effect(() => console.log(count));
</script>
```

### Don't Create Stores in Components

```svelte
<!-- BAD - Store created in component -->
<script>
  let store = $state({ items: [] });  // This is local, not shared
</script>

<!-- GOOD - Import store from .svelte.ts file -->
<script>
  import { itemStore } from '$lib/stores/items.svelte';
</script>
```

### Don't Fetch in Render

```svelte
<!-- BAD - Fetches on every render -->
<script>
  const promise = fetch('/api/data').then(r => r.json());
</script>

{#await promise}...{/await}

<!-- GOOD - Fetch in effect or onMount -->
<script>
  import { onMount } from 'svelte';

  let data = $state(null);

  onMount(async () => {
    data = await fetch('/api/data').then(r => r.json());
  });
</script>
```
