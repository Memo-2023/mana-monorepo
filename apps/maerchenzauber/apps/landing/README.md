# Storyteller Landingpage

Landing page for Storyteller - a magical children's story generation app.

Built with [Astro](https://astro.build), [React](https://react.dev), and [Tailwind CSS](https://tailwindcss.com).

**Live Site**: https://maerchenzauber.netlify.app

## 🚀 Project Structure

```text
landingpage/
├── public/              # Static assets
├── src/
│   ├── components/
│   │   ├── layout/     # Navigation, Footer
│   │   ├── sections/   # Hero, Features, FAQ, etc.
│   │   └── ui/         # Reusable UI components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Routes (index, download, privacy, etc.)
│   └── styles/         # Global styles
├── netlify.toml        # Netlify configuration
└── package.json
```

## 🧞 Commands

All commands are run from the `landingpage` directory:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🚀 Deployment to Netlify

### Prerequisites
- Netlify CLI installed: `npm install -g netlify-cli`
- Netlify account and site created

### Deploy to Production

```bash
# From the landingpage directory

# 1. Build the site
npm run build

# 2. Deploy to production
netlify deploy --prod --dir=dist
```

### One-line Deployment

```bash
npm run build && netlify deploy --prod --dir=dist
```

### Configuration

The site is configured for deployment via `netlify.toml`:

```toml
[build]
  base = "landingpage"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"
```

**Note**: This project is part of a monorepo. The `netlify.toml` in the repository root handles the build context.

### Automatic Deployment

To enable automatic deployment on git push:

1. Go to [Netlify Dashboard](https://app.netlify.com/projects/maerchenzauber/settings)
2. Navigate to "Build & deploy" → "Link repository"
3. Connect your GitHub repository
4. Netlify will automatically deploy on every push to main

## 👀 Want to learn more?

- [Astro Documentation](https://docs.astro.build)
- [Netlify Documentation](https://docs.netlify.com)
