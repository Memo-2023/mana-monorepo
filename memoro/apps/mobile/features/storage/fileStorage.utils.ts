// Use a type-safe approach for MIME type detection
let mime: { lookup: (path: string) => string | false; extension: (type: string) => string | false } = {
  lookup: (path: string): string | false => {
    // Simple extension-based MIME type detection
    const ext = path.split('.').pop()?.toLowerCase();
    if (!ext) return false;
    
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'html': 'text/html',
      'json': 'application/json',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'm4a': 'audio/mp4',
      'wav': 'audio/wav',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
    };
    
    return mimeTypes[ext] || false;
  },
  extension: (type: string): string | false => {
    // Simple MIME type to extension mapping
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'text/html': 'html',
      'application/json': 'json',
      'audio/mpeg': 'mp3',
      'video/mp4': 'mp4',
      'audio/mp4': 'm4a',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
      'application/x-tar': 'tar',
      'application/gzip': 'gz',
    };
    
    return extMap[type] || false;
  }
};

// Try to load the actual mime-types module if available
try {
   
  const mimeTypes = require('react-native-mime-types');
  if (mimeTypes && typeof mimeTypes.lookup === 'function') {
    mime = mimeTypes;
  }
} catch (e) {
  console.debug('react-native-mime-types not available, using fallback implementation');
}

/**
 * Gets the MIME type for a file based on its name
 * @param fileName Name of the file
 * @returns MIME type string
 */
export const getFileMimeType = (fileName: string): string => {
  const mimeType = mime.lookup(fileName);
  if (typeof mimeType === 'string') {
    return mimeType;
  }
  // Default to binary data if no specific type is found
  return 'application/octet-stream';
};

/**
 * Cleans base64 data by removing the data URL prefix if present
 * @param data Base64 data string, possibly with data URL prefix
 * @returns Clean base64 string without prefix
 */
export const cleanBase64Data = (data: string): string => {
  const match = data.match(/^data:[^;]+;base64,(.+)$/i);
  return match ? match[1] : data;
};

/**
 * Creates a data URI from a file name and base64 data
 * @param fileName Name of the file
 * @param base64Data Base64-encoded file content
 * @returns Data URI string
 */
export const createFileUri = (fileName: string, base64Data: string): string => {
  const mimeType = getFileMimeType(fileName);
  return `data:${mimeType};base64,${base64Data}`;
};

/**
 * Gets MIME type from a file path or URL
 * @param path File path or URL
 * @returns MIME type string
 */
export const getMimeTypeFromPath = (path: string): string => {
  let fileName = path;
  try {
    if (path.startsWith('http')) {
      const url = new URL(path);
      const pathParts = decodeURIComponent(url.pathname).split('/');
      [fileName] = pathParts[pathParts.length - 1].split('?');
    }
  } catch (error) {
    console.debug('Could not extract filename from URL:', error);
  }
  return getFileMimeType(fileName);
};

/**
 * Options for generating a file name
 */
export interface FileNameOptions {
  userId?: string;
  prefix?: string;
  extension?: string;
  originalName?: string;
}

/**
 * Generates a unique file name with timestamp
 * @param options Options for file name generation
 * @returns Generated file name
 */
export const generateFileName = (options: FileNameOptions = {}): string => {
  const {
    userId,
    prefix = 'file',
    extension,
    originalName = '',
  } = options;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const datePart = `${year}${month}${day}`;
  const timePart = `${hours}${minutes}${seconds}`;

  const userPart = userId ? `_${userId}` : '';

  let extensionPart = '';
  if (extension) {
    extensionPart = `.${extension}`;
  } else if (originalName && originalName.includes('.')) {
    extensionPart = `.${originalName.split('.').pop()}`;
  }

  return `${prefix}${userPart}_${datePart}_${timePart}${extensionPart}`;
};

/**
 * Information about a MIME type
 */
export interface MimeTypeInfo {
  mimeType: string;
  extension: string;
}

/**
 * Gets file extension from MIME type
 * @param mimeType MIME type string
 * @returns File extension without leading dot
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  const ext = mime.extension(mimeType);
  if (ext) return ext;

  // Fallback mappings for common types
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/plain': 'txt',
    'application/json': 'json',
  };
  
  return mimeToExt[mimeType] || 'bin';
};

/**
 * Gets MIME type information from various source types
 * @param source File source (string path/URL, Blob, or File)
 * @returns MIME type information
 */
export const getMimeTypeInfo = (source: string | Blob | File): MimeTypeInfo => {
  // For Blobs/Files
  if (typeof window !== 'undefined') {
    // Check if source is a Blob
    const isBlob = typeof Blob !== 'undefined' && source instanceof Blob;
    // Check if source is a File (which extends Blob)
    const isFile = typeof File !== 'undefined' && source instanceof File;
    
    if (isBlob || isFile) {
      const fileName = isFile ? (source as File).name : '';
      const mimeType = (source as Blob).type || getFileMimeType(fileName) || 'application/octet-stream';
      return {
        mimeType,
        extension: getExtensionFromMimeType(mimeType),
      };
    }
  }

  // For Strings
  if (typeof source === 'string') {
    // For data: URLs
    if (source.startsWith('data:')) {
      const mimeMatch = source.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      return {
        mimeType,
        extension: getExtensionFromMimeType(mimeType),
      };
    }

    // For file:// and content:// URLs
    if (source.startsWith('file://') || source.startsWith('content://')) {
      const mimeType = getFileMimeType(source);
      return {
        mimeType,
        extension: getExtensionFromMimeType(mimeType),
      };
    }

    // For http(s):// URLs
    if (source.startsWith('http')) {
      try {
        const url = new URL(source);
        const fileName = decodeURIComponent(url.pathname.split('/').pop() || '');
        const mimeType = getFileMimeType(fileName);
        return {
          mimeType,
          extension: getExtensionFromMimeType(mimeType),
        };
      } catch {
        return {
          mimeType: 'application/octet-stream',
          extension: 'bin',
        };
      }
    }
  }

  // Fallback
  return {
    mimeType: 'application/octet-stream',
    extension: 'bin',
  };
};
