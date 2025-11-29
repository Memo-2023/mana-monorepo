# useEffect Cleanup Patterns

This directory contains custom hooks that help ensure proper cleanup in useEffect hooks to prevent memory leaks and other issues.

## Custom Hooks

### 1. `useAutoFocus`

Automatically focuses an input element with proper timeout cleanup.

```tsx
const inputRef = useRef<TextInput>(null);
useAutoFocus(inputRef, { delay: 300 });
```

### 2. `useTimeout`

Manages setTimeout with automatic cleanup on unmount.

```tsx
// Automatic cleanup
useTimeout(() => {
	showToast('Welcome!');
}, 2000);

// Conditional timeout
useTimeout(
	() => {
		showToast('Welcome!');
	},
	isFirstVisit ? 2000 : null
);
```

### 3. `useTimeoutFn`

Returns functions to manually control timeouts with cleanup.

```tsx
const { setTimeout, clearTimeout } = useTimeoutFn();

const handleClick = () => {
	setTimeout(() => {
		console.log('Delayed action');
	}, 1000);
};
```

### 4. `useAsyncEffect`

Handles async operations in useEffect with proper cleanup.

```tsx
useAsyncEffect(
	async (isMounted) => {
		const data = await fetchData();
		if (isMounted()) {
			setData(data);
		}
	},
	[id]
);
```

### 5. `useAsyncEffectWithCleanup`

Uses AbortController for cancellable async operations.

```tsx
useAsyncEffectWithCleanup(
	async (signal) => {
		const response = await fetch(url, { signal });
		const data = await response.json();
		setData(data);
	},
	[url]
);
```

## Common Patterns That Need Cleanup

### 1. setTimeout/setInterval

```tsx
// ❌ Bad - No cleanup
useEffect(() => {
	setTimeout(() => {
		doSomething();
	}, 1000);
}, []);

// ✅ Good - With cleanup
useEffect(() => {
	const timer = setTimeout(() => {
		doSomething();
	}, 1000);

	return () => clearTimeout(timer);
}, []);
```

### 2. Event Listeners

```tsx
// ❌ Bad - No cleanup
useEffect(() => {
	window.addEventListener('resize', handleResize);
}, []);

// ✅ Good - With cleanup
useEffect(() => {
	window.addEventListener('resize', handleResize);

	return () => {
		window.removeEventListener('resize', handleResize);
	};
}, []);
```

### 3. Subscriptions

```tsx
// ❌ Bad - No cleanup
useEffect(() => {
	const subscription = service.subscribe(handleUpdate);
}, []);

// ✅ Good - With cleanup
useEffect(() => {
	const subscription = service.subscribe(handleUpdate);

	return () => {
		subscription.unsubscribe();
	};
}, []);
```

### 4. Async Operations

```tsx
// ❌ Bad - Can update unmounted component
useEffect(() => {
	async function fetchData() {
		const data = await api.getData();
		setData(data); // Might run after unmount
	}
	fetchData();
}, []);

// ✅ Good - Checks if mounted
useEffect(() => {
	let isMounted = true;

	async function fetchData() {
		const data = await api.getData();
		if (isMounted) {
			setData(data);
		}
	}

	fetchData();

	return () => {
		isMounted = false;
	};
}, []);
```

## Migration Guide

To migrate existing code:

1. Replace direct `setTimeout` in useEffect with `useTimeout` hook
2. Replace manual auto-focus logic with `useAutoFocus` hook
3. Use `useAsyncEffect` for async operations that update state
4. Always return cleanup functions for:
   - Timers (setTimeout, setInterval)
   - Event listeners
   - Subscriptions
   - Observers
   - WebSocket connections
