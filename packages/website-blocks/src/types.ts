import type { Component, Snippet } from 'svelte';
import type { ZodTypeAny, z } from 'zod';

/**
 * Render modes for every block component.
 *
 * - `edit`    — Inside the editor. Shows inline-edit affordances (e.g. click
 *               a Hero title to edit it), may render placeholder copy for
 *               empty required fields.
 * - `preview` — Editor preview pane. Same rendering as `public` but inside
 *               the editor chrome (responsive preview, breakpoint switcher).
 * - `public`  — Served to real visitors via SvelteKit SSR. No edit chrome,
 *               no placeholders — only real data. This is the mode the
 *               published_snapshots blob is serialized for.
 */
export type BlockMode = 'edit' | 'preview' | 'public';

/**
 * A single block in the tree. Props are block-type-specific and validated
 * against the registered Zod schema at write time (in stores) and at
 * publish time (in the snapshot builder).
 *
 * When the renderer passes a block into a container component, the
 * block's own children (blocks whose `parentBlockId === this.id`) are
 * pre-arranged into `children`. Leaf blocks always have `children = []`
 * or undefined.
 */
export interface Block<Props = unknown> {
	id: string;
	type: string;
	props: Props;
	schemaVersion: number;
	order: number;
	parentBlockId: string | null;
	slotKey: string | null;
	children?: Block[];
}

/**
 * Category for grouping blocks in the insert palette.
 */
export type BlockCategory = 'content' | 'media' | 'layout' | 'form' | 'embed';

/**
 * Props passed to every block renderer.
 *
 * `children` is the block's direct children (one level). For container
 * blocks (columns, future tabs/accordion), consumers render each child
 * by invoking the `renderChild` snippet — this pushes the outer chrome
 * (click-to-select in edit mode, cache tagging in public mode) back out
 * to the renderer that owns it, so the container doesn't need to know
 * about selection state or mode-specific wrappers.
 *
 * `onEdit` is only present in `edit` mode — guard with
 * `if (mode === 'edit' && onEdit)`.
 */
export interface BlockRenderProps<Props = unknown> {
	block: Block<Props>;
	mode: BlockMode;
	children?: Block[];
	renderChild?: Snippet<[Block]>;
	onEdit?: (patch: Partial<Props>) => void;
}

/**
 * Props passed to every block inspector (right pane of the editor).
 */
export interface BlockInspectorProps<Props = unknown> {
	block: Block<Props>;
	onChange: (patch: Partial<Props>) => void;
}

/**
 * Registered spec for one block type. The schema, renderer, inspector,
 * and metadata are bundled — the editor and public renderer consume the
 * same spec, so drift is structurally impossible.
 */
export interface BlockSpec<Props = unknown> {
	/** Stable type id, used in DB (`blocks.type`) and in code. */
	type: string;
	/** Human label shown in the insert palette. */
	label: string;
	/** Lucide icon name (or any icon id the editor knows how to render). */
	icon: string;
	/** Category for palette grouping. */
	category: BlockCategory;
	/** Zod schema defining valid props. Enforced at write + publish time. */
	schema: ZodTypeAny;
	/** Current schema version. Bump when the schema shape changes. */
	schemaVersion: number;
	/** Default prop values when a new block of this type is inserted. */
	defaults: Props;
	/** Svelte 5 component rendering the block in all three modes. */
	Component: Component<BlockRenderProps<Props>>;
	/** Svelte 5 component rendering the inspector form for this block. */
	Inspector: Component<BlockInspectorProps<Props>>;
	/**
	 * Optional upgraders: version N → version N+1 prop transformer.
	 * Keyed by the SOURCE version (v1 → v2 upgrader lives under key `1`).
	 */
	upgraders?: Record<number, (oldProps: unknown) => Props>;
}

/** Helper to infer props type from a spec's schema. */
export type PropsOf<Spec extends BlockSpec<unknown>> = Spec extends BlockSpec<infer P> ? P : never;

/** Helper to infer props type from a Zod schema. */
export type InferProps<S extends ZodTypeAny> = z.infer<S>;
