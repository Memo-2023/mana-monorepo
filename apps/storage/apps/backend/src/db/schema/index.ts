// Folders (must be first due to self-reference)
export * from './folders.schema';

// Files (references folders)
export * from './files.schema';

// File versions (references files)
export * from './file-versions.schema';

// Tags
export * from './tags.schema';

// File-Tags junction (references files and tags)
export * from './file-tags.schema';

// Shares (references files and folders)
export * from './shares.schema';
