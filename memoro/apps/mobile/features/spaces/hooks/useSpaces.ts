import { useState, useCallback } from 'react';
import spaceService, { 
  Space,
  CreateSpaceRequest, 
  UpdateSpaceRequest 
} from '../services/spaceService';

export default function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all spaces
  const fetchSpaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const spacesData = await spaceService.getSpaces();
      setSpaces(spacesData);
    } catch (err) {
      setError('Failed to fetch spaces');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new space
  const createSpace = useCallback(async (spaceData: CreateSpaceRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const newSpace = await spaceService.createSpace(spaceData);
      setSpaces(prevSpaces => [...prevSpaces, newSpace]);
      return newSpace;
    } catch (err) {
      setError('Failed to create space');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update an existing space
  const updateSpace = useCallback(async (spaceId: string, spaceData: UpdateSpaceRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedSpace = await spaceService.updateSpace(spaceId, spaceData);
      setSpaces(prevSpaces => 
        prevSpaces.map(space => 
          space.id === spaceId ? updatedSpace : space
        )
      );
      return updatedSpace;
    } catch (err) {
      setError('Failed to update space');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a space
  const deleteSpace = useCallback(async (spaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await spaceService.deleteSpace(spaceId);
      setSpaces(prevSpaces => 
        prevSpaces.filter(space => space.id !== spaceId)
      );
      return true;
    } catch (err) {
      setError('Failed to delete space');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a specific space by ID
  const getSpace = useCallback(async (spaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const space = await spaceService.getSpace(spaceId);
      return space;
    } catch (err) {
      setError('Failed to fetch space details');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get memos for a specific space
  const getSpaceMemos = useCallback(async (spaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const memos = await spaceService.getSpaceMemos(spaceId);
      return memos;
    } catch (err) {
      setError('Failed to fetch space memos');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Link a memo to a space
  const linkMemoToSpace = useCallback(async (memoId: string, spaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await spaceService.linkMemoToSpace(memoId, spaceId);
      return success;
    } catch (err) {
      setError('Failed to link memo to space');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unlink a memo from a space
  const unlinkMemoFromSpace = useCallback(async (memoId: string, spaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await spaceService.unlinkMemoFromSpace(memoId, spaceId);
      return success;
    } catch (err) {
      setError('Failed to unlink memo from space');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Leave a space (for non-owners)
  const leaveSpace = useCallback(async (spaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await spaceService.leaveSpace(spaceId);
      // If successful, remove the space from the state
      if (success) {
        setSpaces(prevSpaces => 
          prevSpaces.filter(space => space.id !== spaceId)
        );
      }
      return success;
    } catch (err) {
      setError('Failed to leave space');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load spaces when component mounts
  // TODO: Temporarily disabled until spaces feature is fully implemented
  // useEffect(() => {
  //   fetchSpaces();
  // }, [fetchSpaces]);

  return {
    spaces,
    isLoading,
    error,
    fetchSpaces,
    createSpace,
    updateSpace,
    deleteSpace,
    leaveSpace,
    getSpace,
    getSpaceMemos,
    linkMemoToSpace,
    unlinkMemoFromSpace
  };
}