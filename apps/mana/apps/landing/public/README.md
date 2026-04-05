# Public Assets Directory

This directory contains all static assets for the Mana landing page.

## Directory Structure:

```
public/
├── logos/          # Brand logos and variations
├── icons/          # Favicons and app icons
├── images/         # General images and graphics
└── README.md       # This file
```

## Asset Management Guidelines:

### File Organization:

- Keep assets organized in their respective subdirectories
- Don't place files directly in the public root unless necessary
- Each subdirectory has its own README with specific guidelines

### Version Control:

- Commit optimized images only
- Use Git LFS for large binary files if needed
- Avoid committing source files (PSD, AI, etc.) - keep those elsewhere

### Performance Considerations:

1. Always optimize images before committing
2. Use appropriate formats (SVG for logos/icons, WebP/JPG for photos)
3. Implement lazy loading for non-critical images
4. Consider using a CDN for production

### Accessibility:

- Always provide alt text for images in your components
- Ensure sufficient contrast for overlaid text on images
- Test icons and images for color blind accessibility

## Quick Reference:

- **Logos**: `/public/logos/` - Brand identity assets
- **Icons**: `/public/icons/` - Favicons and app icons
- **Images**: `/public/images/` - Photos, illustrations, backgrounds

## Next Steps:

1. Add the Mana logo files to the `/logos` directory
2. Generate and add favicon set to the `/icons` directory
3. Add any hero images or illustrations to the `/images` directory
4. Update the Astro components to reference these assets
