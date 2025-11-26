export interface ImageValidationResult {
  mimeType: string;
  isValid: boolean;
}

export function validateBase64Image(
  base64String: string,
): ImageValidationResult {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

  try {
    // Check if it's valid base64
    if (!isValidBase64(base64Data)) {
      throw new Error('Invalid base64 format');
    }

    // Get MIME type from data URL
    const mimeType = getMimeType(base64String);
    if (!mimeType) {
      throw new Error('Invalid image format');
    }

    // Validate file size (8MB limit)
    const sizeInBytes = Math.round(base64Data.length * 0.75);
    if (sizeInBytes > 8 * 1024 * 1024) {
      throw new Error('Image size too large. Maximum size is 8MB');
    }

    return {
      mimeType,
      isValid: true,
    };
  } catch (error) {
    throw error;
  }
}

function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

function getMimeType(dataUrl: string): string {
  const matches = dataUrl.match(
    /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/,
  );
  if (matches && matches.length > 1) {
    return matches[1];
  }
  throw new Error('Invalid image format');
}

export async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}
