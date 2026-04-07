// FIXME: prerender is disabled because the SvelteKit prerender worker
// throws "Error: 500 /offline" with no usable stack trace during the
// production build. Suspected cause: a module-level side-effect on the
// shared layout (vault-client? data-layer-listeners?) that fails when
// no `window` is available. SSR'ing the offline page at request time
// is harmless — it's a static "you're offline" message — but the real
// fix is to find which import throws on the bare server and guard it.
//
// First observed: 2026-04-07 during Memoro recording pipeline deploy.
export const prerender = false;
