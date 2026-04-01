# Cross-Type Drag & Drop System

Shared DnD system for ManaCore apps. Enables dragging items between different
component types (e.g. Tag onto Task, Task onto Trash zone).

Designed to coexist with `svelte-dnd-action` which handles same-type reordering.

## Architecture

Two layers:

- **Layer 1 (Pointer Events):** For items NOT managed by svelte-dnd-action.
  Tag pills in the TagStrip use `dragSource` to become draggable, TaskItems use
  `dropTarget` to accept tags. Works on mouse, touch, and pen via Pointer Events.

- **Layer 2 (Passive Overlay):** For items already managed by svelte-dnd-action.
  When a Task is being reordered via svelte-dnd-action, `passiveDropZone` detects
  if the pointer hovers over a Tag pill or ActionZone and fires the appropriate
  action on drop. No conflict with existing DnD.

## Usage

### Make an element draggable (Layer 1)

```svelte
<script>
  import { dragSource } from '@manacore/shared-ui/dnd';
</script>

<button use:dragSource={{
  type: 'tag',
  data: () => ({ id: tag.id, name: tag.name, color: tag.color }),
}}>
  {tag.name}
</button>
```

- Desktop: drag starts after 5px mouse movement
- Mobile: drag starts after 300ms long-press (with haptic feedback)

### Make an element a drop target (Layer 1)

```svelte
<script>
  import { dropTarget } from '@manacore/shared-ui/dnd';
</script>

<div use:dropTarget={{
  accepts: ['tag'],
  onDrop: (payload) => assignTag(item.id, payload.data.id),
  canDrop: (payload) => !item.tagIds.includes(payload.data.id),
}}>
  {item.title}
</div>
```

CSS class `mana-drop-target-hover` is added during hover,
`mana-drop-target-success` briefly after a successful drop.

### React to svelte-dnd-action drags (Layer 2)

```svelte
<script>
  import { passiveDropZone, registerSvelteActionDrag, clearSvelteActionDrag } from '@manacore/shared-ui/dnd';
</script>

<!-- In your svelte-dnd-action handlers: -->
<div
  use:dndzone={{ items, type: 'task-dnd' }}
  onconsider={(e) => {
    items = e.detail.items;
    registerSvelteActionDrag({ type: 'task', data: { id: e.detail.info.id } });
  }}
  onfinalize={(e) => {
    // ... normal handling ...
    clearSvelteActionDrag();
  }}
>

<!-- On external targets (e.g. tag pills): -->
<button use:passiveDropZone={{
  accepts: ['task'],
  onDrop: (payload) => assignTag(tag.id, payload.data.id),
  highlightClass: 'my-highlight-class',
}}>
```

### Floating preview + action zones

Place once in your app layout:

```svelte
<script>
  import { DragPreview, ActionZone } from '@manacore/shared-ui/dnd';
</script>

<DragPreview />
<ActionZone
  accepts={['task']}
  onDrop={(payload) => deleteItem(payload.data.id)}
  variant="danger"
  label="Delete"
/>
```

`ActionZone` auto-shows/hides when any drag is active.
Variants: `danger`, `warning`, `info`, `success`.

## Drag Types

| Type | Used by |
|------|---------|
| `tag` | Tag pills (TagStrip, PillTagSelector) |
| `task` | Todo tasks (TaskList, Kanban) |
| `card` | Cards app |
| `photo` | Photos app |
| `file` | Storage app |
| `event` | Calendar events |
| `link` | uLoad links |
| `contact` | Contacts |

## CSS Classes

| Class | When |
|-------|------|
| `mana-drag-source-active` | On the source element during drag |
| `mana-drop-target-hover` | On drop target while valid item hovers |
| `mana-drop-target-success` | Brief flash after successful drop |
| `mana-passive-zone-hover` | On passive zone while item hovers |
| `mana-passive-zone-success` | Brief flash after successful passive drop |

## Files

| File | Purpose |
|------|---------|
| `types.ts` | DragType, payload interfaces, option types |
| `drag-state.svelte.ts` | Global reactive state (Svelte 5 runes) |
| `drag-source.ts` | `use:dragSource` action (Pointer Events) |
| `drop-target.ts` | `use:dropTarget` action |
| `passive-drop.ts` | `use:passiveDropZone` action (Layer 2) |
| `DragPreview.svelte` | Floating drag ghost |
| `ActionZone.svelte` | Trash/archive drop zone |
