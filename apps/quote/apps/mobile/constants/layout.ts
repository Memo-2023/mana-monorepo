// Global layout constants for consistent spacing across the app

// List item spacing
export const LIST_ITEM_SPACING = {
  horizontal: 16,  // px-4 in Tailwind = 16px
  vertical: 20,     // mb-5 in Tailwind = 20px - größerer Abstand
};

// Padding for list containers
export const LIST_CONTAINER_PADDING = {
  top: 140,        // Increased space for header with blur to prevent cards from touching header
  bottom: 160,     // Space for segmented controls and tab bar
};

// Tailwind class names for consistent spacing
export const LIST_ITEM_CLASSES = {
  wrapper: 'px-4 mb-5',  // Horizontal padding and bottom margin - größerer Abstand mb-5
  wrapperNoMargin: 'px-4', // Just horizontal padding
};