# Blog Image Guidelines

## Overview

This document defines the visual standards and guidelines for all blog images on the Memoro website. Following these guidelines ensures consistency, professionalism, and brand alignment across all content.

## Visual Identity

### Core Principles

- **Modern & Professional**: Clean, contemporary design that reflects Memoro's innovative approach
- **Tech-Forward but Human-Centric**: Balance technical sophistication with approachability
- **Consistent Brand Experience**: Every image should feel like part of the Memoro family
- **Accessibility First**: High contrast, clear visuals that work for all users

### Brand Colors

- **Primary Yellow**: `#F8D62B`
- **Accent Colors**: Use sparingly for highlights
- **Backgrounds**: Primarily white (`#FFFFFF`) or black (`#181818`)
- **Text on Images**: Dark gray (`#333333`) for maximum readability

## Image Types & Specifications

### 1. Hero Images

- **Purpose**: Article headers, primary visual impact
- **Dimensions**: 1200x630px (Open Graph optimized)
- **Style**: Bold, eye-catching, sets the article tone
- **File Size**: Max 200KB (optimized WebP)

### 2. Concept Visualizations

- **Purpose**: Abstract representations of complex ideas
- **Dimensions**: 800x450px
- **Style**: Minimalist diagrams, icons, and shapes
- **Use When**: Explaining abstract concepts, workflows, or systems

### 3. Workflow Diagrams

- **Purpose**: Step-by-step process illustrations
- **Dimensions**: 800x450px or 1000x600px for complex flows
- **Style**: Numbered steps, clear flow direction, consistent iconography
- **Elements**: Arrows, numbered circles, descriptive labels

### 4. Comparison Graphics

- **Purpose**: Before/after, with/without scenarios
- **Dimensions**: 800x450px
- **Style**: Split-screen or side-by-side layouts
- **Key Feature**: Clear visual distinction between states

### 5. Data Visualizations

- **Purpose**: Statistics, metrics, performance indicators
- **Dimensions**: 600x400px
- **Style**: Clean charts, modern gauges, progress indicators
- **Colors**: Use brand colors for data points

## Design Standards

### Typography on Images

- **Headings**: Sans-serif, bold, minimum 24pt
- **Body Text**: Sans-serif, regular, minimum 16pt
- **Font Suggestions**: Inter, Roboto, or system fonts
- **Contrast**: Always ensure WCAG AA compliance

### Iconography

- **Style**: Outline or filled, consistent weight
- **Size**: Minimum 32x32px for visibility
- **Sources**: Heroicons, Tabler Icons, or custom
- **Consistency**: Use same icon set throughout article

### Composition Guidelines

- **Spacing**: Generous whitespace, avoid clutter
- **Alignment**: Consistent grid system
- **Hierarchy**: Clear visual priority
- **Balance**: Even distribution of visual weight

## AI Image Generation Prompts

### Standard Prompt Structure

```
Create a [IMAGE TYPE] showing [DESCRIPTION].
Style: Modern, professional, clean design.
Colors: Use blue (#0066CC) and purple (#6B46C1) as primary colors.
Background: White or light gray.
Additional: [SPECIFIC REQUIREMENTS]
Dimensions: [WIDTH]x[HEIGHT]px
Avoid: Stock photo clichés, overly complex designs, dark backgrounds
```

### Example Prompts by Type

#### Hero Image

```
Create a hero image visualizing AI-powered meeting assistance.
Style: Modern, professional, clean design with abstract geometric shapes.
Colors: Gradient from blue (#0066CC) to purple (#6B46C1).
Background: White with subtle geometric patterns.
Include: Floating interface elements suggesting productivity.
Dimensions: 1200x630px
Avoid: Literal office scenes, stock photo style
```

#### Workflow Diagram

```
Design a 4-step workflow diagram for meeting documentation.
Style: Flat design with numbered steps connected by flowing lines.
Colors: Primary blue (#0066CC) with purple accents.
Each step: Icon + short label, connected by arrows.
Background: Clean white.
Dimensions: 800x450px
```

## Do's and Don'ts

### ✅ DO

- Use consistent visual language across article series
- Include subtle gradients and modern effects
- Maintain high contrast for accessibility
- Add subtle shadows for depth
- Use brand colors prominently
- Keep text minimal and impactful
- Test images at different sizes

### ❌ DON'T

- Use generic stock photos
- Include photos of real people (unless team photos)
- Create overly complex or busy designs
- Use conflicting color schemes
- Add unnecessary decorative elements
- Use low-resolution or pixelated graphics
- Forget mobile optimization

## File Management

### Naming Convention

```
[article-slug]-[image-type]-[number].webp
```

Examples:

- `prompt-engineering-hero-01.webp`
- `ai-assistant-workflow-01.webp`
- `decision-making-comparison-01.webp`

### Storage Structure

```
/public/images/blog/
├── heroes/          # Hero images
├── diagrams/        # Workflow and concept diagrams
├── comparisons/     # Before/after graphics
└── data-viz/        # Charts and data visualizations
```

### Optimization Requirements

1. **Format**: WebP with JPG fallback
2. **Compression**: 85% quality for WebP
3. **Lazy Loading**: Implement for all non-hero images
4. **Alt Text**: Descriptive, keyword-optimized
5. **Responsive**: Provide 2x versions for retina displays

## Implementation Checklist

Before publishing any blog image:

- [ ] Follows brand color guidelines
- [ ] Meets dimension requirements
- [ ] Under 200KB file size
- [ ] Has descriptive alt text
- [ ] Tested on mobile devices
- [ ] Consistent with article series style
- [ ] Optimized for web performance
- [ ] Accessible contrast ratios

## Tools & Resources

### Recommended Design Tools

- **Figma**: For creating custom graphics
- **Canva**: For quick layouts with brand templates
- **draw.io**: For technical diagrams
- **DALL-E / Midjourney**: For AI-generated base images

### Optimization Tools

- **Squoosh**: Web-based image optimization
- **ImageOptim**: Mac app for batch optimization
- **TinyPNG**: Online WebP/PNG optimization

### Color & Contrast Checkers

- **WebAIM Contrast Checker**
- **Stark (Figma plugin)**
- **Colorable.co**

## Version History

- v1.0 (2025-01-22): Initial guidelines created
- Created by: Till Schneider
- Last updated: 2025-01-22

---

For questions or suggestions about these guidelines, please contact the content team.
