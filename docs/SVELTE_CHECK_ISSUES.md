# Svelte Check - Pre-commit Enforcement

Last updated: 2024-12-15

## Overview

All web apps in this monorepo are protected by **pre-commit hooks** that run `svelte-check` with `--threshold warning`. This ensures no a11y issues, TypeScript errors, or Svelte 5 problems can be committed.

## Current Status

All main web apps pass svelte-check with **0 errors and 0 warnings**:

| Package | Status |
|---------|--------|
| @manacore/web | Clean |
| @clock/web | Clean |
| @chat/web | Clean |
| @manadeck/web | Clean |
| @calendar/web | Clean |
| @zitare/web | Clean |
| @contacts/web | Clean |
| @picture/web | Clean |
| @todo/web | Clean |

## How It Works

### Pre-commit Hook

When you commit `.svelte` files, the hook automatically:

1. Detects which web apps have changes
2. Runs `svelte-check --threshold warning` on affected apps
3. **Blocks the commit** if any warnings or errors are found

```bash
# What happens on commit:
🔍 Running svelte-check on affected web apps...

━━━ Checking apps/todo/apps/web ━━━
✅ svelte-check passed for apps/todo/apps/web

✅ All svelte-checks passed!
```

### If Check Fails

```bash
━━━ Checking apps/todo/apps/web ━━━
/path/to/file.svelte:42:3
Warn: Elements with onclick must have onkeydown handler

❌ svelte-check failed for apps/todo/apps/web

❌ svelte-check failed! Fix the issues above before committing.
```

You must fix the warnings before you can commit.

---

## Common Warnings & How to Fix Them

### 1. Click Events Need Keyboard Events

**Warning:** `a11y_click_events_have_key_events`

```svelte
<!-- BAD -->
<div onclick={() => doSomething()}>Click me</div>

<!-- GOOD: Add keyboard handler -->
<div
  onclick={() => doSomething()}
  onkeydown={(e) => e.key === 'Enter' && doSomething()}
  role="button"
  tabindex="0"
>
  Click me
</div>

<!-- BEST: Use semantic element -->
<button type="button" onclick={() => doSomething()}>Click me</button>
```

### 2. Non-interactive Element with Interactions

**Warning:** `a11y_no_static_element_interactions`

```svelte
<!-- BAD -->
<div onclick={handleClick}>Click me</div>

<!-- GOOD: Add role and tabindex -->
<div onclick={handleClick} onkeydown={() => {}} role="button" tabindex="0">
  Click me
</div>

<!-- For modal backdrops (suppress with comment): -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="backdrop" onclick={closeModal} onkeydown={() => {}}></div>
```

### 3. Buttons Need Labels

**Warning:** `a11y_consider_explicit_label`

```svelte
<!-- BAD -->
<button onclick={close}>
  <svg>...</svg>
</button>

<!-- GOOD -->
<button onclick={close} aria-label="Close">
  <svg>...</svg>
</button>
```

### 4. Autofocus Warning

**Warning:** `a11y_autofocus`

```svelte
<!-- Suppress if intentional (e.g., modal input): -->
<!-- svelte-ignore a11y_autofocus -->
<input type="text" autofocus />
```

### 5. Interactive Role Needs Focus

**Warning:** `a11y_interactive_supports_focus`

```svelte
<!-- BAD -->
<div role="menu" onclick={toggle}>Menu</div>

<!-- GOOD -->
<div role="menu" tabindex="-1" onclick={toggle} onkeydown={() => {}}>Menu</div>
```

### 6. Nested Interactive Elements

**Warning:** `node_invalid_placement_ssr`

```svelte
<!-- BAD: button inside button causes hydration issues -->
<button class="card">
  <button class="action">Delete</button>
</button>

<!-- GOOD: Use svelte-ignore if necessary -->
<!-- svelte-ignore node_invalid_placement_ssr -->
<button class="card">
  <button class="action">Delete</button>
</button>

<!-- BETTER: Restructure HTML -->
<div class="card" role="group">
  <button class="card-body">Select</button>
  <button class="action">Delete</button>
</div>
```

### 7. Svelte 5 Reactivity

**Warning:** `non_reactive_update`

```svelte
<!-- BAD: Won't trigger re-renders in Svelte 5 -->
<script lang="ts">
  let count = 0;
</script>

<!-- GOOD: Use $state() -->
<script lang="ts">
  let count = $state(0);
</script>
```

---

## Modal Pattern (Common Fix)

Most modal warnings can be fixed with this pattern:

```svelte
{#if showModal}
  <!-- Backdrop: svelte-ignore for click-to-close -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="modal-backdrop"
    onclick={() => (showModal = false)}
    onkeydown={(e) => e.key === 'Escape' && (showModal = false)}
    role="presentation"
  >
    <!-- Modal content: stop propagation -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="modal-content"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <!-- Modal content here -->
    </div>
  </div>
{/if}
```

---

## Dropdown/Menu Pattern

```svelte
{#if showDropdown}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_interactive_supports_focus -->
  <div
    class="dropdown"
    onclick={(e) => e.stopPropagation()}
    onkeydown={() => {}}
    role="menu"
    tabindex="-1"
  >
    <button role="menuitem" onclick={() => selectOption('a')}>Option A</button>
    <button role="menuitem" onclick={() => selectOption('b')}>Option B</button>
  </div>
{/if}
```

---

## Running Checks Manually

```bash
# Check a specific app
pnpm --filter @todo/web exec svelte-check --threshold warning

# Check all staged files (same as pre-commit)
./scripts/svelte-check-staged.sh

# Quick check without threshold (shows all issues)
pnpm --filter @todo/web exec svelte-check
```

---

## Bypassing Pre-commit (Emergency Only)

If you absolutely must commit without checks (e.g., WIP branch):

```bash
git commit --no-verify -m "WIP: work in progress"
```

**Warning:** This bypasses ALL pre-commit hooks. Use sparingly and fix issues before PR.

---

## Files

| File | Purpose |
|------|---------|
| `.husky/pre-commit` | Runs lint-staged, type-check, and svelte-check |
| `scripts/svelte-check-staged.sh` | Detects affected apps and runs checks |
| `docs/SVELTE_CHECK_ISSUES.md` | This documentation |
