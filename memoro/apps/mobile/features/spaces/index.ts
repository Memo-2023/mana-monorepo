// Export context and hooks
export { default as SpaceProvider, useSpaceContext } from './contexts/SpaceContext';

// Export types
export type { Space, CreateSpaceRequest, UpdateSpaceRequest } from './services/spaceService';

// Export services
export { default as spaceService } from './services/spaceService';

// Export components
export { default as CreateSpaceModal } from './components/CreateSpaceModal';

// Export store
export { useSpaceStore } from './store/spaceStore';