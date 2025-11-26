/**
 * Utility for deep comparison of objects.
 * This is used to detect changes in deeply nested objects like metadata.processing.
 */

/**
 * Checks if a value is an object (not null, not array, not date)
 */
const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value) && 
         !(value instanceof Date);
};

/**
 * Deep compare two objects to detect changes
 * Returns true if there are differences, false if identical
 */
export const hasDeepChanges = (
  objA: Record<string, any> | undefined | null, 
  objB: Record<string, any> | undefined | null,
  paths: string[] = []
): boolean => {
  // If both are undefined or null, no changes
  if (objA === undefined && objB === undefined) return false;
  if (objA === null && objB === null) return false;
  
  // If only one is undefined/null, there are changes
  if (objA === undefined || objA === null) return true;
  if (objB === undefined || objB === null) return true;
  
  // For specific paths, check only those paths
  if (paths.length > 0) {
    return paths.some(path => {
      const parts = path.split('.');
      let valueA = objA;
      let valueB = objB;
      
      // Navigate the path
      for (const part of parts) {
        if (valueA === undefined || valueA === null) return valueB !== undefined && valueB !== null;
        if (valueB === undefined || valueB === null) return true;
        
        valueA = valueA[part];
        valueB = valueB[part];
      }
      
      // Compare the final values
      if (isObject(valueA) && isObject(valueB)) {
        return hasDeepChanges(valueA, valueB);
      }
      
      return valueA !== valueB;
    });
  }
  
  // If no specific paths, check all keys
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  // If the objects have different numbers of keys, they're different
  if (keysA.length !== keysB.length) return true;
  
  // Check if any key exists in one object but not the other
  for (const key of keysA) {
    if (!(key in objB)) return true;
  }
  
  // Compare each key's value
  for (const key of keysA) {
    const valueA = objA[key];
    const valueB = objB[key];
    
    // If both values are objects, recurse
    if (isObject(valueA) && isObject(valueB)) {
      if (hasDeepChanges(valueA, valueB)) return true;
    } 
    // Otherwise, compare values directly
    else if (valueA !== valueB) {
      return true;
    }
  }
  
  return false;
};

/**
 * Checks specifically for processing status changes in memo metadata
 */
export const hasProcessingStatusChanged = (
  prevMetadata: Record<string, any> | undefined | null,
  newMetadata: Record<string, any> | undefined | null
): boolean => {
  // Specific paths to check for processing status changes
  const processingPaths = [
    'processing.transcription.status',
    'processing.headline.status',
    'processing.headline_and_intro.status',
    'transcriptionStatus'
  ];
  
  return hasDeepChanges(prevMetadata, newMetadata, processingPaths);
};