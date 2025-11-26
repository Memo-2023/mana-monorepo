import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

export interface Workspace {
	id: string;
	name: string;
	slug?: string;
	type: 'personal' | 'team';
	owner?: string;
}

// Keys for localStorage
const STORAGE_KEY = 'activeWorkspaceId';
const WORKSPACE_DATA_KEY = 'activeWorkspaceData';

// Create the store
function createActiveWorkspaceStore() {
	// Initialize from localStorage if in browser
	const initialId = browser ? localStorage.getItem(STORAGE_KEY) : null;
	const initialData = browser && initialId ? localStorage.getItem(WORKSPACE_DATA_KEY) : null;
	
	// Stores
	const workspaceId = writable<string | null>(initialId);
	const workspaceData = writable<Workspace | null>(
		initialData ? JSON.parse(initialData) : null
	);
	
	// Persist to localStorage when ID changes
	if (browser) {
		workspaceId.subscribe(id => {
			if (id) {
				localStorage.setItem(STORAGE_KEY, id);
			} else {
				localStorage.removeItem(STORAGE_KEY);
				localStorage.removeItem(WORKSPACE_DATA_KEY);
			}
		});
		
		workspaceData.subscribe(data => {
			if (data) {
				localStorage.setItem(WORKSPACE_DATA_KEY, JSON.stringify(data));
			} else {
				localStorage.removeItem(WORKSPACE_DATA_KEY);
			}
		});
	}
	
	return {
		// Expose the stores
		id: workspaceId,
		data: workspaceData,
		
		// Set active workspace
		set: (workspace: Workspace | null) => {
			if (workspace) {
				workspaceId.set(workspace.id);
				workspaceData.set(workspace);
				console.log('[WORKSPACE STORE] Set active workspace:', workspace.name, workspace.id);
			} else {
				workspaceId.set(null);
				workspaceData.set(null);
				console.log('[WORKSPACE STORE] Cleared active workspace');
			}
		},
		
		// Set by ID only (data will be fetched later)
		setId: (id: string | null) => {
			workspaceId.set(id);
			if (!id) {
				workspaceData.set(null);
			}
			console.log('[WORKSPACE STORE] Set workspace ID:', id);
		},
		
		// Clear the active workspace
		clear: () => {
			workspaceId.set(null);
			workspaceData.set(null);
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
				localStorage.removeItem(WORKSPACE_DATA_KEY);
			}
			console.log('[WORKSPACE STORE] Cleared workspace');
		},
		
		// Get current workspace ID synchronously
		getId: (): string | null => {
			return get(workspaceId);
		},
		
		// Get current workspace data synchronously
		getData: (): Workspace | null => {
			return get(workspaceData);
		},
		
		// Navigate to a page while optionally maintaining workspace context
		goto: async (path: string, options?: any) => {
			const currentId = get(workspaceId);
			
			// Always add workspace parameter if we have one
			// The server will handle it being optional
			if (currentId && !path.includes('workspace=')) {
				const separator = path.includes('?') ? '&' : '?';
				path = `${path}${separator}workspace=${currentId}`;
			}
			
			return goto(path, options);
		},
		
		// Build URL with workspace parameter
		buildUrl: (path: string): string => {
			const currentId = get(workspaceId);
			
			// Always add workspace parameter if we have one
			// The server will handle it being optional
			if (currentId && !path.includes('workspace=')) {
				const separator = path.includes('?') ? '&' : '?';
				return `${path}${separator}workspace=${currentId}`;
			}
			
			return path;
		},
		
		// Initialize from URL parameter (call this in layout)
		initFromUrl: (urlWorkspaceId: string | null) => {
			const currentId = get(workspaceId);
			
			// URL parameter takes precedence
			if (urlWorkspaceId && urlWorkspaceId !== currentId) {
				console.log('[WORKSPACE STORE] Updating from URL parameter:', urlWorkspaceId);
				workspaceId.set(urlWorkspaceId);
				// Note: workspace data should be fetched and set by the component
			}
		}
	};
}

// Export the store
export const activeWorkspace = createActiveWorkspaceStore();

// Derived store for convenience
export const isInWorkspace = derived(
	activeWorkspace.id,
	$id => !!$id
);

// Helper to get workspace URL slug
export const workspaceSlug = derived(
	activeWorkspace.data,
	$data => $data?.slug || null
);