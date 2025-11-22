# React to SvelteKit Migration Guide

## Executive Summary

This comprehensive guide provides migration patterns for transitioning from React to SvelteKit, based on thorough documentation research conducted in January 2025. The guide covers component syntax, routing strategies, state management, data fetching, event handling, and best practices for SvelteKit project structure.

---

## Table of Contents

1. [Framework Philosophy](#framework-philosophy)
2. [Component Syntax Comparison](#component-syntax-comparison)
3. [Reactivity System](#reactivity-system)
4. [Routing Migration Strategy](#routing-migration-strategy)
5. [State Management Equivalents](#state-management-equivalents)
6. [Data Fetching Patterns](#data-fetching-patterns)
7. [Event Handling Differences](#event-handling-differences)
8. [Lifecycle Methods](#lifecycle-methods)
9. [Form Handling](#form-handling)
10. [Project Structure Best Practices](#project-structure-best-practices)
11. [Performance Considerations](#performance-considerations)
12. [Migration Checklist](#migration-checklist)

---

## Framework Philosophy

### React (Runtime Framework)
- Uses Virtual DOM for reconciliation
- Runtime reactivity through hooks (useState, useEffect, useMemo)
- Component-based architecture with JSX
- Large runtime bundle (~40-50kb min+gzip base)
- Requires additional libraries for routing, forms, etc.

### SvelteKit (Compiler Framework)
- Compiles components to optimized JavaScript at build time
- No Virtual DOM - direct DOM manipulation
- Reactivity through runes (compile-time primitives)
- Smaller bundle sizes (compiled components are lightweight)
- Full-stack framework with built-in routing, forms, SSR

**Key Insight**: Svelte is a compiler that transforms declarative components into efficient imperative code, while React is a runtime library that manages component updates through Virtual DOM diffing.

---

## Component Syntax Comparison

### Basic Component Structure

#### React (Functional Component)
```jsx
// UserProfile.jsx
import React, { useState } from 'react';

function UserProfile({ initialName, age }) {
  const [name, setName] = useState(initialName);
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <div className="profile">
      <h1>{name}</h1>
      <p>Age: {age}</p>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}

export default UserProfile;
```

#### SvelteKit (Svelte 5 with Runes)
```svelte
<!-- UserProfile.svelte -->
<script>
  // Props using $props rune
  let { initialName, age } = $props();

  // Reactive state using $state rune
  let name = $state(initialName);
  let count = $state(0);

  function handleClick() {
    count += 1; // Direct mutation - automatically reactive
  }
</script>

<div class="profile">
  <h1>{name}</h1>
  <p>Age: {age}</p>
  <p>Count: {count}</p>
  <button onclick={handleClick}>Increment</button>
</div>

<style>
  .profile {
    /* Scoped styles - no CSS-in-JS library needed */
    padding: 1rem;
  }
</style>
```

### Key Differences

| Aspect | React | Svelte/SvelteKit |
|--------|-------|------------------|
| **File Extension** | `.jsx` or `.tsx` | `.svelte` |
| **Template Syntax** | JSX (JavaScript expressions) | HTML-like with `{}` for expressions |
| **Props** | Function parameters | `$props()` rune with destructuring |
| **State** | `useState` hook | `$state()` rune |
| **Styles** | CSS-in-JS or external | Scoped `<style>` block |
| **Class Names** | `className` | `class` |
| **Imports** | Explicit React import | No framework import needed |

---

## Reactivity System

### React Hooks vs Svelte Runes

#### 1. State Management

**React:**
```jsx
const [count, setCount] = useState(0);
const [user, setUser] = useState({ name: 'John', age: 30 });

// Update requires setter
setCount(count + 1);
setUser({ ...user, age: 31 }); // Immutable update
```

**Svelte:**
```svelte
<script>
  let count = $state(0);
  let user = $state({ name: 'John', age: 30 });

  // Direct mutation - automatically reactive
  count += 1;
  user.age = 31; // Deep reactivity works automatically
</script>
```

#### 2. Computed/Derived Values

**React:**
```jsx
// useMemo for expensive computations
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0);
}, [items]);

// Or simple variable (recomputes on every render)
const doubled = count * 2;
```

**Svelte:**
```svelte
<script>
  let items = $state([...]);

  // Automatically memoized and tracks dependencies
  const total = $derived(
    items.reduce((sum, item) => sum + item.price, 0)
  );

  // Dependencies tracked at runtime
  const doubled = $derived(count * 2);
</script>
```

#### 3. Side Effects

**React:**
```jsx
useEffect(() => {
  console.log(`Count changed to ${count}`);

  // Cleanup function
  return () => {
    console.log('Cleanup');
  };
}, [count]); // Explicit dependency array
```

**Svelte:**
```svelte
<script>
  $effect(() => {
    console.log(`Count changed to ${count}`);

    // Cleanup with return function
    return () => {
      console.log('Cleanup');
    };
  }); // No dependency array - auto-tracked
</script>
```

### Reactivity Comparison Table

| Feature | React | Svelte 5 |
|---------|-------|----------|
| **State** | `useState(0)` | `$state(0)` |
| **Computed** | `useMemo()` | `$derived()` |
| **Effects** | `useEffect()` | `$effect()` |
| **Refs** | `useRef()` | `$state()` (or direct variable) |
| **Callback** | `useCallback()` | Not needed (functions are stable) |
| **Context** | `useContext()` | Svelte context API or stores |
| **Dependency Tracking** | Manual (dependency array) | Automatic (runtime tracking) |
| **Mutation** | Immutable updates only | Direct mutation works |
| **Deep Reactivity** | No (requires immutable patterns) | Yes (automatic) |

---

## Routing Migration Strategy

### React Router → SvelteKit File-Based Routing

#### React Router Setup
```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/blog/my-post">Blog Post</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/settings/*" element={<SettingsLayout />}>
          <Route path="profile" element={<Profile />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

#### SvelteKit File-Based Routing

**Directory Structure:**
```
src/routes/
├── +page.svelte              # Home page (/)
├── +layout.svelte            # Root layout (nav, etc.)
├── about/
│   └── +page.svelte          # About page (/about)
├── blog/
│   ├── +page.svelte          # Blog list (/blog)
│   └── [slug]/
│       ├── +page.svelte      # Dynamic route (/blog/my-post)
│       └── +page.server.js   # Server-side data loading
└── settings/
    ├── +layout.svelte        # Nested layout for settings
    ├── profile/
    │   └── +page.svelte      # /settings/profile
    └── account/
        └── +page.svelte      # /settings/account
```

**Root Layout:**
```svelte
<!-- src/routes/+layout.svelte -->
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/blog/my-post">Blog Post</a>
</nav>

<!-- Renders child pages -->
<slot />
```

**Dynamic Route:**
```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script>
  // Access route data from load function
  let { data } = $props();
</script>

<article>
  <h1>{data.post.title}</h1>
  <div>{@html data.post.content}</div>
</article>
```

### Routing Comparison Table

| Feature | React Router | SvelteKit |
|---------|--------------|-----------|
| **Route Definition** | JSX `<Route>` components | File system structure |
| **Dynamic Routes** | `:param` syntax | `[param]` folder name |
| **Navigation** | `<Link>` component | Native `<a>` tags |
| **Nested Routes** | `<Outlet>` component | Nested `<slot>` in layouts |
| **Layout Wrapping** | Manual wrapper components | `+layout.svelte` files |
| **Programmatic Nav** | `useNavigate()` hook | `goto()` from `$app/navigation` |
| **Route Guards** | Custom components/HOCs | Load functions with redirects |
| **Not Found** | `<Route path="*">` | `+error.svelte` file |

### Migration Strategy

1. **Map Routes**: List all React Router routes and their corresponding file paths
2. **Create Directory Structure**: Set up `src/routes/` folder hierarchy
3. **Convert Dynamic Routes**: Change `:param` to `[param]` folders
4. **Extract Layouts**: Identify common layouts and create `+layout.svelte` files
5. **Replace Navigation**: Change `<Link>` to `<a>` tags
6. **Migrate Route Loaders**: Convert data fetching to load functions (see Data Fetching section)

---

## State Management Equivalents

### Redux/Context API → Svelte Stores

#### React with Redux
```jsx
// store.js
import { createStore } from 'redux';

const initialState = { count: 0, user: null };

function reducer(state = initialState, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

export const store = createStore(reducer);

// Component.jsx
import { useSelector, useDispatch } from 'react-redux';

function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();

  return (
    <button onClick={() => dispatch({ type: 'INCREMENT' })}>
      Count: {count}
    </button>
  );
}
```

#### React Context API
```jsx
// UserContext.jsx
import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

// Component.jsx
function Profile() {
  const { user, setUser } = useUser();
  return <div>{user?.name}</div>;
}
```

#### Svelte Stores

**Writable Store:**
```javascript
// stores.js
import { writable } from 'svelte/store';

export const count = writable(0);
export const user = writable(null);
```

**Component Usage:**
```svelte
<script>
  import { count, user } from './stores.js';

  // Auto-subscription with $ prefix
  // No need to manually subscribe/unsubscribe
</script>

<button onclick={() => $count++}>
  Count: {$count}
</button>

<div>{$user?.name}</div>

<button onclick={() => user.set({ name: 'John' })}>
  Set User
</button>
```

**Custom Store (Redux-like):**
```javascript
// counterStore.js
import { writable } from 'svelte/store';

function createCounter() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  };
}

export const counter = createCounter();
```

**Usage:**
```svelte
<script>
  import { counter } from './counterStore.js';
</script>

<button onclick={counter.increment}>+</button>
<span>{$counter}</span>
<button onclick={counter.decrement}>-</button>
<button onclick={counter.reset}>Reset</button>
```

**Derived Store:**
```javascript
// stores.js
import { writable, derived } from 'svelte/store';

export const items = writable([
  { id: 1, name: 'Item 1', price: 10 },
  { id: 2, name: 'Item 2', price: 20 }
]);

// Computed value from store(s)
export const total = derived(items, $items =>
  $items.reduce((sum, item) => sum + item.price, 0)
);
```

**Readable Store (for external subscriptions):**
```javascript
// timeStore.js
import { readable } from 'svelte/store';

export const time = readable(new Date(), set => {
  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  // Cleanup when last subscriber unsubscribes
  return () => clearInterval(interval);
});
```

### State Management Comparison

| Feature | Redux | Context API | Svelte Stores |
|---------|-------|-------------|---------------|
| **Setup Complexity** | High | Medium | Low |
| **Boilerplate** | High | Medium | Low |
| **Provider Required** | Yes | Yes | No |
| **Auto-subscription** | No | No | Yes (with `$`) |
| **Derived State** | Selectors | Manual | `derived()` |
| **DevTools** | Yes | Limited | Extension available |
| **Server-Side** | Complex | Complex | Simple (`.server.js` suffix) |
| **Performance** | Good (with optimization) | Can cause re-renders | Excellent (fine-grained) |

---

## Data Fetching Patterns

### useEffect + fetch → Load Functions

#### React Data Fetching
```jsx
import { useState, useEffect } from 'react';

function BlogPost({ slug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${slug}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]); // Re-fetch when slug changes

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

#### SvelteKit Load Functions

**Server-side Load Function:**
```javascript
// src/routes/blog/[slug]/+page.server.js
import { error } from '@sveltejs/kit';

export async function load({ params, fetch }) {
  try {
    // This runs on the server only
    // Can access database, environment variables, etc.
    const response = await fetch(`/api/posts/${params.slug}`);

    if (!response.ok) {
      throw error(404, 'Post not found');
    }

    const post = await response.json();

    return {
      post
    };
  } catch (err) {
    throw error(500, 'Failed to load post');
  }
}
```

**Component:**
```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script>
  // Data automatically available from load function
  let { data } = $props();
</script>

<!-- No loading state needed - SSR handles this -->
<article>
  <h1>{data.post.title}</h1>
  <div>{data.post.content}</div>
</article>
```

**Universal Load Function (runs on both server and client):**
```javascript
// src/routes/blog/[slug]/+page.js
export async function load({ params, fetch }) {
  // Runs on server during SSR
  // Runs on client during client-side navigation
  const response = await fetch(`/api/posts/${params.slug}`);

  if (!response.ok) {
    throw error(404, 'Post not found');
  }

  const post = await response.json();

  return { post };
}
```

**Load Function with Dependencies:**
```javascript
// src/routes/blog/[slug]/+page.server.js
export async function load({ params, fetch, depends }) {
  // Track custom dependencies
  depends('app:blog-post');

  const [post, comments] = await Promise.all([
    fetch(`/api/posts/${params.slug}`).then(r => r.json()),
    fetch(`/api/posts/${params.slug}/comments`).then(r => r.json())
  ]);

  return { post, comments };
}
```

**Invalidating Data from Component:**
```svelte
<script>
  import { invalidate } from '$app/navigation';

  let { data } = $props();

  async function refreshPost() {
    // Re-run load functions
    await invalidate('app:blog-post');
  }
</script>

<button onclick={refreshPost}>Refresh</button>
```

### Data Fetching Comparison

| Feature | React (useEffect) | SvelteKit Load Functions |
|---------|-------------------|--------------------------|
| **When Runs** | After component mounts | Before page renders |
| **SSR Support** | Manual setup | Built-in |
| **Loading State** | Manual management | Automatic |
| **Error Handling** | Try/catch + state | `error()` helper |
| **Waterfalls** | Common problem | Parallel by default |
| **Caching** | Manual/React Query | Automatic |
| **Revalidation** | Manual/dependencies | `invalidate()` API |
| **Type Safety** | Manual typing | Automatic inference |

### API Routes Comparison

#### Next.js API Route
```javascript
// pages/api/posts/[slug].js
export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method === 'GET') {
    const post = await db.posts.findOne({ slug });
    res.status(200).json(post);
  } else if (req.method === 'POST') {
    // Handle POST
  }
}
```

#### SvelteKit Server Route
```javascript
// src/routes/api/posts/[slug]/+server.js
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
  const post = await db.posts.findOne({ slug: params.slug });
  return json(post);
}

export async function POST({ params, request }) {
  const data = await request.json();
  // Handle POST
  return json({ success: true });
}

export async function DELETE({ params }) {
  // Handle DELETE
  return json({ deleted: true });
}
```

---

## Event Handling Differences

### React vs Svelte Event Syntax

#### React Event Handling
```jsx
function EventsExample() {
  const [value, setValue] = useState('');

  // Inline handler
  const handleClick = () => {
    console.log('Clicked');
  };

  // Handler with parameter
  const handleClickWithParam = (id) => {
    console.log('Clicked:', id);
  };

  // Prevent default
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted');
  };

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <button onClick={() => handleClickWithParam(123)}>
        Click with param
      </button>

      <form onSubmit={handleSubmit}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </form>

      {/* Stop propagation */}
      <div onClick={() => console.log('Parent')}>
        <button onClick={(e) => {
          e.stopPropagation();
          console.log('Child');
        }}>
          Click me
        </button>
      </div>
    </div>
  );
}
```

#### Svelte 5 Event Handling
```svelte
<script>
  let value = $state('');

  function handleClick() {
    console.log('Clicked');
  }

  function handleClickWithParam(id) {
    console.log('Clicked:', id);
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log('Submitted');
  }
</script>

<div>
  <!-- Standard event handler -->
  <button onclick={handleClick}>Click</button>

  <!-- Handler with parameter -->
  <button onclick={() => handleClickWithParam(123)}>
    Click with param
  </button>

  <!-- Form submission -->
  <form onsubmit={handleSubmit}>
    <input
      bind:value={value}
    />
  </form>

  <!-- Event modifiers (legacy syntax in Svelte 4, use manual in Svelte 5) -->
  <div onclick={() => console.log('Parent')}>
    <button onclick={(e) => {
      e.stopPropagation();
      console.log('Child');
    }}>
      Click me
    </button>
  </div>
</div>
```

### Component Events

#### React (Callback Props)
```jsx
// Child.jsx
function Child({ onCustomEvent }) {
  return (
    <button onClick={() => onCustomEvent({ detail: 'data' })}>
      Trigger Event
    </button>
  );
}

// Parent.jsx
function Parent() {
  const handleCustomEvent = (data) => {
    console.log('Custom event:', data);
  };

  return <Child onCustomEvent={handleCustomEvent} />;
}
```

#### Svelte 5 (Callback Props - Recommended)
```svelte
<!-- Child.svelte -->
<script>
  let { onCustomEvent } = $props();
</script>

<button onclick={() => onCustomEvent?.({ detail: 'data' })}>
  Trigger Event
</button>

<!-- Parent.svelte -->
<script>
  import Child from './Child.svelte';

  function handleCustomEvent(data) {
    console.log('Custom event:', data);
  }
</script>

<Child onCustomEvent={handleCustomEvent} />
```

### Event Handling Comparison

| Feature | React | Svelte 5 |
|---------|-------|----------|
| **Event Names** | camelCase (`onClick`) | lowercase (`onclick`) |
| **Prevent Default** | `e.preventDefault()` | Manual or form action |
| **Stop Propagation** | `e.stopPropagation()` | Manual in handler |
| **Event Modifiers** | Manual in handler | Manual (legacy modifiers removed) |
| **Component Events** | Callback props | Callback props (recommended) |
| **Performance** | New function per render | Function created once |
| **Two-way Binding** | Controlled components | `bind:value` directive |

---

## Lifecycle Methods

### React Lifecycle Hooks → Svelte Lifecycle

#### React Lifecycle
```jsx
import { useState, useEffect, useLayoutEffect, useRef } from 'react';

function LifecycleExample() {
  const [data, setData] = useState(null);
  const isMounted = useRef(true);

  // Component mount
  useEffect(() => {
    console.log('Component mounted');

    // Fetch data
    async function loadData() {
      const response = await fetch('/api/data');
      const result = await response.json();
      if (isMounted.current) {
        setData(result);
      }
    }

    loadData();

    // Component unmount
    return () => {
      console.log('Component unmounting');
      isMounted.current = false;
    };
  }, []); // Empty deps = mount/unmount only

  // Watch specific value
  useEffect(() => {
    console.log('Data changed:', data);
  }, [data]);

  // Before paint (like componentDidUpdate)
  useLayoutEffect(() => {
    // DOM measurements before browser paint
  }, []);

  return <div>{data?.title}</div>;
}
```

#### Svelte Lifecycle
```svelte
<script>
  import { onMount, onDestroy, beforeUpdate, afterUpdate, tick } from 'svelte';

  let data = $state(null);

  // Component mount (similar to useEffect with empty deps)
  onMount(async () => {
    console.log('Component mounted');

    // Async operations allowed
    const response = await fetch('/api/data');
    data = await response.json();

    // Return cleanup function
    return () => {
      console.log('Component unmounting');
    };
  });

  // Component unmount (can also be separate)
  onDestroy(() => {
    console.log('Component destroying');
  });

  // Before any DOM update
  beforeUpdate(() => {
    console.log('About to update DOM');
  });

  // After DOM update
  afterUpdate(() => {
    console.log('DOM updated');
  });

  // Watch specific value with $effect
  $effect(() => {
    console.log('Data changed:', data);
  });

  // Wait for pending state changes
  async function handleClick() {
    data = { title: 'New' };
    await tick(); // Wait for DOM to update
    console.log('DOM now reflects new data');
  }
</script>

<button onclick={handleClick}>Update</button>
<div>{data?.title}</div>
```

### Lifecycle Comparison Table

| React Hook | Svelte Function | When It Runs |
|------------|-----------------|--------------|
| `useEffect(() => {}, [])` | `onMount()` | After component mounts |
| `useEffect(() => { return cleanup })` | `onDestroy()` | Before unmount |
| `useEffect(() => {}, [deps])` | `$effect()` | When dependencies change |
| `useLayoutEffect()` | `beforeUpdate()` | Before DOM updates |
| N/A | `afterUpdate()` | After DOM updates |
| N/A | `tick()` | Wait for pending updates |

### Key Differences

1. **onMount** can be `async` - React's useEffect cannot
2. **$effect** auto-tracks dependencies - React requires manual dependency array
3. **tick()** provides explicit DOM update control - React has no equivalent
4. **beforeUpdate/afterUpdate** provide fine-grained DOM lifecycle control

---

## Form Handling

### React Forms vs SvelteKit Form Actions

#### React Form Handling
```jsx
import { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors(data.errors);
        return;
      }

      // Success
      alert('Form submitted!');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setErrors({ submit: 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        disabled={submitting}
      />
      {errors.name && <span>{errors.name}</span>}

      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        disabled={submitting}
      />
      {errors.email && <span>{errors.email}</span>}

      <textarea
        name="message"
        value={formData.message}
        onChange={handleChange}
        disabled={submitting}
      />
      {errors.message && <span>{errors.message}</span>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

#### SvelteKit Form Actions

**Server Action:**
```javascript
// src/routes/contact/+page.server.js
import { fail } from '@sveltejs/kit';

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    const email = data.get('email');
    const message = data.get('message');

    // Validation
    const errors = {};
    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    if (!message) errors.message = 'Message is required';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, name, email, message });
    }

    // Process form (save to DB, send email, etc.)
    await db.contacts.create({ name, email, message });

    return { success: true };
  }
};
```

**Component (works without JavaScript!):**
```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
  import { enhance } from '$app/forms';

  let { form } = $props(); // Contains validation errors & data
</script>

<form method="POST" use:enhance>
  <input
    name="name"
    value={form?.name ?? ''}
  />
  {#if form?.errors?.name}
    <span>{form.errors.name}</span>
  {/if}

  <input
    name="email"
    type="email"
    value={form?.email ?? ''}
  />
  {#if form?.errors?.email}
    <span>{form.errors.email}</span>
  {/if}

  <textarea
    name="message"
    value={form?.message ?? ''}
  />
  {#if form?.errors?.message}
    <span>{form.errors.message}</span>
  {/if}

  <button type="submit">Submit</button>
</form>

{#if form?.success}
  <p>Form submitted successfully!</p>
{/if}
```

**Named Actions:**
```javascript
// src/routes/auth/+page.server.js
import { fail } from '@sveltejs/kit';

export const actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    // Handle login
    return { success: true };
  },

  register: async ({ request }) => {
    const data = await request.formData();
    // Handle registration
    return { success: true };
  }
};
```

```svelte
<!-- Use named actions with ?/actionName -->
<form method="POST" action="?/login" use:enhance>
  <!-- Login form -->
</form>

<form method="POST" action="?/register" use:enhance>
  <!-- Register form -->
</form>
```

**Progressive Enhancement:**
```svelte
<script>
  import { enhance } from '$app/forms';

  let { form } = $props();
</script>

<form
  method="POST"
  use:enhance={({ formElement, formData, action, cancel, submitter }) => {
    // Runs before submission
    console.log('Submitting...');

    // Can modify formData
    formData.set('timestamp', Date.now().toString());

    // Can cancel submission
    // cancel();

    return async ({ result, update }) => {
      // Runs after submission
      if (result.type === 'success') {
        console.log('Success!');
      }

      // Apply default behavior (update form prop, etc.)
      await update();

      // Or handle manually
      // if (result.type === 'redirect') {
      //   goto(result.location);
      // }
    };
  }}
>
  <!-- Form fields -->
</form>
```

### Form Handling Comparison

| Feature | React | SvelteKit |
|---------|-------|-----------|
| **JavaScript Required** | Yes | No (progressive enhancement) |
| **Form State** | Manual with useState | Automatic via `form` prop |
| **Validation** | Client-side or manual | Server-side with `fail()` |
| **Submission** | Fetch API | Native form submission |
| **Loading State** | Manual | Built-in with `use:enhance` |
| **Error Handling** | Try/catch + state | Return from action |
| **File Uploads** | FormData + fetch | Native FormData |
| **Multiple Actions** | Different endpoints | Named actions on same page |

---

## Project Structure Best Practices

### React (Create React App / Next.js) vs SvelteKit

#### React Project Structure
```
my-react-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── Button.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   └── Blog/
│   │       ├── BlogList.jsx
│   │       └── BlogPost.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── utils/
│   │   └── helpers.js
│   ├── api/
│   │   └── client.js
│   ├── App.jsx
│   └── index.jsx
├── package.json
└── README.md
```

#### SvelteKit Project Structure
```
my-sveltekit-app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Header.svelte
│   │   │   ├── Footer.svelte
│   │   │   └── Button.svelte
│   │   ├── server/
│   │   │   ├── db.js        # Server-only code
│   │   │   └── auth.js
│   │   ├── stores/
│   │   │   └── user.js
│   │   └── utils/
│   │       └── helpers.js
│   ├── routes/
│   │   ├── +page.svelte          # Home page
│   │   ├── +layout.svelte        # Root layout
│   │   ├── +layout.server.js     # Root layout data
│   │   ├── about/
│   │   │   └── +page.svelte      # About page
│   │   ├── blog/
│   │   │   ├── +page.svelte      # Blog list
│   │   │   ├── +page.server.js   # Blog list data
│   │   │   └── [slug]/
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.js
│   │   ├── api/
│   │   │   └── posts/
│   │   │       └── +server.js    # API endpoint
│   │   └── +error.svelte         # Error page
│   ├── app.html                  # HTML template
│   └── hooks.server.js           # Server hooks
├── static/
│   ├── favicon.png
│   └── robots.txt
├── svelte.config.js
├── vite.config.js
└── package.json
```

### Key Directories

#### `src/lib/` ($lib alias)
- Reusable components, utilities, stores
- Imported via `$lib` alias: `import Button from '$lib/components/Button.svelte'`
- Shareable across the entire application

#### `src/lib/server/` ($lib/server alias)
- Server-only code (database, auth, secrets)
- Imported via `$lib/server` alias
- SvelteKit ensures this code never reaches the client

#### `src/routes/`
- File-based routing structure
- `+page.svelte` - Page components
- `+page.js` - Universal load functions
- `+page.server.js` - Server-only load functions
- `+layout.svelte` - Layout components
- `+server.js` - API endpoints
- `+error.svelte` - Error pages

#### `static/`
- Static assets served at root (robots.txt, favicon, etc.)
- Files accessible at `/filename`

### Naming Conventions

| React | SvelteKit |
|-------|-----------|
| `Component.jsx` | `Component.svelte` |
| `pages/about.jsx` | `routes/about/+page.svelte` |
| `api/posts.js` (Next.js) | `routes/api/posts/+server.js` |
| `_app.jsx` (Next.js) | `routes/+layout.svelte` |
| `_document.jsx` (Next.js) | `app.html` |
| `middleware.js` | `hooks.server.js` |

### Code Organization Patterns

**React Pattern (feature-based):**
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── api/
│   └── blog/
│       ├── components/
│       ├── hooks/
│       └── api/
```

**SvelteKit Pattern (route-based):**
```
src/
├── routes/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.js
│   │   └── register/
│   │       └── +page.svelte
│   └── blog/
│       ├── +page.svelte
│       └── [slug]/
│           └── +page.svelte
├── lib/
│   ├── components/
│   │   └── auth/
│   │       └── LoginForm.svelte
│   └── server/
│       └── auth.js
```

### Best Practices

1. **Use $lib for shared code** - Import via `$lib` alias for clean imports
2. **Server-only code in $lib/server** - Prevents accidental client exposure
3. **Colocate route-specific code** - Keep page components near their routes
4. **Use +layout.svelte for common UI** - Reduce duplication with layouts
5. **Leverage load functions** - Keep data fetching separate from UI
6. **Named exports for multiple actions** - Use named form actions on same page
7. **Use kebab-case for files/folders** - Consistent with web standards

---

## Performance Considerations

### Bundle Size

**React:**
- React runtime: ~42KB (minified + gzipped)
- React DOM: ~130KB (minified + gzipped)
- Total base: ~172KB
- Additional libraries (Router, Redux, etc.) add more

**Svelte:**
- No runtime (compiler-based)
- Component code: ~3-5KB per component (compiled)
- Total base: ~5-10KB
- 90%+ smaller bundles in most cases

### Runtime Performance

| Metric | React | Svelte |
|--------|-------|--------|
| **Initial render** | Virtual DOM diffing | Direct DOM manipulation |
| **Updates** | Re-render tree + diff | Surgical updates |
| **Reactivity** | Runtime hooks | Compile-time analysis |
| **Memory** | Higher (VDOM + fiber) | Lower (no abstraction layer) |

### Optimization Techniques

#### React Optimizations
```jsx
// Memoization
const MemoizedComponent = React.memo(Component);

// Callback memoization
const handleClick = useCallback(() => {}, [deps]);

// Value memoization
const computed = useMemo(() => expensiveCalc(), [deps]);

// Code splitting
const LazyComponent = lazy(() => import('./Component'));
```

#### Svelte Optimizations
```svelte
<!-- Most optimizations built-in -->
<script>
  // Automatic memoization
  const computed = $derived(expensiveCalc());

  // Functions are stable by default (no useCallback needed)
  function handleClick() {}

  // Code splitting
  import LazyComponent from './Component.svelte';
</script>

<!-- Lazy loading -->
{#await import('./Component.svelte') then { default: Component }}
  <Component />
{/await}
```

**Key Insight**: Most React optimizations are unnecessary in Svelte because the compiler handles them automatically.

---

## Migration Checklist

### Phase 1: Planning

- [ ] Audit current React codebase
- [ ] Identify all routes and map to SvelteKit file structure
- [ ] List all state management patterns (Context, Redux, Zustand)
- [ ] Inventory all data fetching patterns
- [ ] Document external API dependencies
- [ ] Review custom hooks and identify Svelte equivalents

### Phase 2: Setup

- [ ] Initialize SvelteKit project: `npm create svelte@latest`
- [ ] Configure TypeScript (if used)
- [ ] Set up adapters for deployment target
- [ ] Configure preprocessors (PostCSS, etc.)
- [ ] Install necessary dependencies
- [ ] Set up environment variables

### Phase 3: Core Migration

- [ ] Create route structure in `src/routes/`
- [ ] Migrate root layout (`_app.jsx` → `+layout.svelte`)
- [ ] Convert pages to `.svelte` files
- [ ] Implement load functions for data fetching
- [ ] Convert React components to Svelte components
- [ ] Migrate state management to stores
- [ ] Convert forms to SvelteKit form actions

### Phase 4: Component Conversion

For each component:
- [ ] Remove React imports
- [ ] Convert JSX to Svelte template syntax
- [ ] Change `className` to `class`
- [ ] Replace `useState` with `$state`
- [ ] Replace `useEffect` with `$effect` or lifecycle functions
- [ ] Replace `useMemo` with `$derived`
- [ ] Convert props from parameters to `$props()`
- [ ] Replace callback props with event handlers
- [ ] Move styles to `<style>` block
- [ ] Test component in isolation

### Phase 5: Advanced Features

- [ ] Implement authentication (session management)
- [ ] Set up API routes (`+server.js`)
- [ ] Configure error handling (`+error.svelte`)
- [ ] Add loading states (`+loading.svelte`)
- [ ] Implement form validation
- [ ] Set up server-side hooks
- [ ] Configure adapters and deployment

### Phase 6: Testing & Optimization

- [ ] Set up Vitest for unit tests
- [ ] Set up Playwright for E2E tests
- [ ] Test all routes and navigation
- [ ] Test form submissions
- [ ] Verify SSR/SSG behavior
- [ ] Check bundle sizes
- [ ] Optimize images and assets
- [ ] Test accessibility
- [ ] Performance audit with Lighthouse

### Phase 7: Deployment

- [ ] Choose and configure adapter
- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor for errors

---

## Quick Reference: Common Patterns

### React → Svelte Translation Table

| React Code | Svelte 5 Code |
|------------|---------------|
| `import React from 'react'` | No import needed |
| `const [x, setX] = useState(0)` | `let x = $state(0)` |
| `const y = useMemo(() => x * 2, [x])` | `const y = $derived(x * 2)` |
| `useEffect(() => {...}, [x])` | `$effect(() => {...})` |
| `const ref = useRef()` | `let ref` |
| `<div className="foo">` | `<div class="foo">` |
| `<button onClick={fn}>` | `<button onclick={fn}>` |
| `<input value={x} onChange={...} />` | `<input bind:value={x} />` |
| `{condition && <Component />}` | `{#if condition}<Component />{/if}` |
| `{items.map(i => <Item {...i} />)}` | `{#each items as i}<Item {...i} />{/each}` |
| `<Component {...props} />` | `<Component {...props} />` (same) |
| `const { prop } = props` | `let { prop } = $props()` |
| `props.children` | `<slot />` |
| `<Link to="/about">` | `<a href="/about">` |
| `useNavigate()` | `goto()` from `$app/navigation` |
| `useParams()` | `params` from load function |
| `useSearchParams()` | `url.searchParams` from load |

---

## Additional Resources

### Official Documentation
- **SvelteKit Docs**: https://svelte.dev/docs/kit/introduction
- **Svelte 5 Docs**: https://svelte.dev/docs/svelte/overview
- **Svelte Tutorial**: https://svelte.dev/tutorial
- **SvelteKit Examples**: https://svelte.dev/examples

### Community Resources
- **Svelte Discord**: https://svelte.dev/chat
- **Svelte Reddit**: https://reddit.com/r/sveltejs
- **SvelteKit GitHub**: https://github.com/sveltejs/kit

### Learning Paths
1. Complete Svelte tutorial (1-2 hours)
2. Build a simple SvelteKit app (3-5 hours)
3. Migrate one React component to Svelte (1 hour)
4. Migrate a small React page to SvelteKit (2-3 hours)
5. Tackle larger features progressively

---

## Conclusion

Migrating from React to SvelteKit involves learning a new paradigm, but many concepts translate directly:

**Easier in Svelte:**
- Less boilerplate (no imports, smaller files)
- Automatic reactivity (no dependency arrays)
- Built-in routing (no React Router)
- Forms work without JS (progressive enhancement)
- Smaller bundles (compiler vs runtime)
- Scoped styles by default

**Requires Adjustment:**
- File-based routing structure
- Load functions instead of useEffect
- Different reactivity model (runes vs hooks)
- Server-side thinking (SSR by default)
- Component events via callbacks (no event system)

**Overall**: SvelteKit provides a more integrated, streamlined developer experience with better performance out of the box. The initial learning curve is offset by reduced complexity in the long run.

---

## Research Metadata

- **Research Date**: January 2025
- **Documentation Sources**:
  - svelte.dev official documentation
  - SvelteKit official guides
  - Community tutorials and comparisons
- **Target Audience**: React developers with intermediate+ experience
- **Migration Scope**: Client-side React apps and Next.js applications
- **Svelte Version**: Svelte 5 (with runes)
- **SvelteKit Version**: Latest stable (2.x)