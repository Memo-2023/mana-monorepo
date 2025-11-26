# Database Switching Guide

## Overview

The application now supports automatic switching between development and production databases to prevent accidental changes to production data during local development.

## Configuration

### Development Mode
- **Database URL**: `http://localhost:8090`
- **Config File**: `.env` (for local development)
- **MCP Config**: `.mcp.development.json`

### Production Mode
- **Database URL**: `https://pb.ulo.ad`
- **Config File**: `.env.production`
- **MCP Config**: `.mcp.json`

## How to Use

### Local Development

1. **Start the local PocketBase server**:
```bash
npm run backend
# or
cd backend && ./pocketbase serve
```

2. **Start the development server**:
```bash
npm run dev
```

3. **Or start both together**:
```bash
npm run dev:all
```

The application will automatically connect to `http://localhost:8090`.

### Production Build

For production builds, the application will use the production database:

```bash
npm run build
npm run preview
```

## Switching Between Environments

### To use local database:
1. Ensure `.env` contains: `PUBLIC_POCKETBASE_URL=http://localhost:8090`
2. Start local PocketBase: `npm run backend`
3. Run development server: `npm run dev`

### To use production database (NOT RECOMMENDED for development):
1. Change `.env` to: `PUBLIC_POCKETBASE_URL=https://pb.ulo.ad`
2. Restart development server: `npm run dev`

⚠️ **WARNING**: Only connect to production database when absolutely necessary. Always use local database for development and testing.

## Verification

To verify which database is being used, check the browser console after starting the dev server. You should see:

```
PocketBase URL: http://localhost:8090
Environment: development
Is Production: false
```

## Files Changed

1. **`src/lib/pocketbase.ts`**: Removed hardcoded production URL, now uses environment variables
2. **`src/hooks.server.ts`**: Added fallback logic for environment-based URL selection
3. **`.env`**: Changed to use local database URL for development
4. **`.mcp.development.json`**: New file for local MCP server configuration
5. **`CLAUDE.md`**: Updated with database configuration documentation

## Troubleshooting

### Local PocketBase not starting
- Check if port 8090 is already in use
- Ensure PocketBase binary is executable: `chmod +x backend/pocketbase`
- Check logs: `cat pocketbase-dev.log`

### Still connecting to production
- Clear browser cache and restart dev server
- Verify `.env` file contains correct URL
- Check console output for which URL is being used

### MCP Server issues
- For local development, use `.mcp.development.json`
- For production, use `.mcp.json`
- Restart Claude Code after changing MCP configuration