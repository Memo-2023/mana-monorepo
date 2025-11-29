import React, { createContext, useContext, ReactNode } from 'react';
import useSpaces from '../hooks/useSpaces';
import { Space, Memo, CreateSpaceRequest, UpdateSpaceRequest } from '../services/spaceService';

// Define the context shape
interface SpaceContextType {
	spaces: Space[];
	isLoading: boolean;
	error: string | null;
	fetchSpaces: () => Promise<void>;
	createSpace: (spaceData: CreateSpaceRequest) => Promise<Space>;
	updateSpace: (spaceId: string, spaceData: UpdateSpaceRequest) => Promise<Space>;
	deleteSpace: (spaceId: string) => Promise<boolean>;
	leaveSpace: (spaceId: string) => Promise<boolean>;
	getSpace: (spaceId: string) => Promise<Space>;
	getSpaceMemos: (spaceId: string) => Promise<Memo[]>;
	linkMemoToSpace: (memoId: string, spaceId: string) => Promise<boolean>;
	unlinkMemoFromSpace: (memoId: string, spaceId: string) => Promise<boolean>;
}

// Create the context
export const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// Create provider component
export const SpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const spacesMethods = useSpaces();

	return <SpaceContext.Provider value={spacesMethods}>{children}</SpaceContext.Provider>;
};

// Custom hook to use the space context
export const useSpaceContext = () => {
	const context = useContext(SpaceContext);
	if (context === undefined) {
		throw new Error('useSpaceContext must be used within a SpaceProvider');
	}
	return context;
};

export default SpaceProvider;
