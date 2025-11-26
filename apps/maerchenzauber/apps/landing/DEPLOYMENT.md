# Landing Page Deployment Guide

## Build Complete ✅

The landing page has been successfully built with universal links support!

## What's Included

- ✅ Static character sharing page (`character.html`)
- ✅ Apple App Site Association file (iOS universal links)
- ✅ Digital Asset Links file (Android App Links)
- ✅ URL rewrite configurations for all major hosting providers

## Deployment Options

### Option 1: Netlify (Recommended for ease)

1. **Deploy to Netlify:**
   ```bash
   # Install Netlify CLI if you haven't
   npm install -g netlify-cli

   # Deploy
   cd landingpage
   netlify deploy --prod --dir=dist
   ```

2. **Configure custom domain:**
   - Go to Netlify dashboard → Domain settings
   - Add `märchen-zauber.de` as custom domain
   - Update DNS to point to Netlify

3. **Verify universal links:**
   ```bash
   curl https://märchen-zauber.de/.well-known/apple-app-site-association
   curl https://märchen-zauber.de/.well-known/assetlinks.json
   ```

The `_redirects` file will automatically handle URL rewrites!

### Option 2: Vercel

1. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI if you haven't
   npm install -g vercel

   # Deploy
   cd landingpage
   vercel --prod
   ```

2. **Configure custom domain:**
   - Go to Vercel dashboard → Settings → Domains
   - Add `märchen-zauber.de`

The `vercel.json` file will automatically handle URL rewrites!

### Option 3: Traditional Web Hosting (Apache/Nginx)

1. **Upload the `dist/` folder** to your web server

2. **Verify `.htaccess` is working** (for Apache):
   - The `.htaccess` file should handle URL rewrites automatically
   - Test: `https://märchen-zauber.de/character/test123/abc456`
   - Should serve the character.html page

3. **For Nginx**, add this to your config:
   ```nginx
   location ~ ^/character/([^/]+)/([^/]+)/?$ {
       rewrite ^/character/([^/]+)/([^/]+)/?$ /character.html last;
   }

   location /.well-known/apple-app-site-association {
       default_type application/json;
   }
   ```

## Testing After Deployment

### Test 1: Verify .well-known files are accessible

```bash
# iOS Universal Links
curl https://märchen-zauber.de/.well-known/apple-app-site-association

# Should return JSON with applinks configuration
# Content-Type should be application/json

# Android App Links
curl https://märchen-zauber.de/.well-known/assetlinks.json

# Should return JSON with Android package info
```

### Test 2: Test character page

```bash
# Should serve the character.html page
curl https://märchen-zauber.de/character/test123/abc456

# Should return HTML content with the character sharing page
```

### Test 3: Test on mobile devices

1. **Create a test character** in the app
2. **Share it** - should generate a link like:
   `https://märchen-zauber.de/character/{id}/{shareCode}`
3. **Send link to yourself** via WhatsApp/SMS
4. **Click the link**:
   - Should be clickable (not grayed out)
   - Should open the app if installed
   - Should show web preview if app not installed

## Important URLs to Verify

After deployment, these URLs MUST work:

1. `https://märchen-zauber.de/.well-known/apple-app-site-association`
   - Must return JSON (no 404)
   - Must have `Content-Type: application/json` header

2. `https://märchen-zauber.de/.well-known/assetlinks.json`
   - Must return JSON (no 404)
   - Must have `Content-Type: application/json` header

3. `https://märchen-zauber.de/character/abc/123`
   - Must return the character sharing page (not 404)
   - Must work even with arbitrary IDs (JavaScript will fetch real data)

## Troubleshooting

### Universal links not working?

**iOS:**
- Clear Safari cache
- Reinstall the app
- Wait a few minutes after deployment (Apple caches the association file)
- Test with: `https://branch.io/resources/aasa-validator/`

**Android:**
- Check the SHA-256 fingerprint matches in `assetlinks.json`
- Clear app data: Settings → Apps → Märchenzauber → Storage → Clear Data
- May take 24-48 hours for Google to verify

### Character page shows 404?

- Check URL rewrites are working
- Netlify: Verify `_redirects` file is deployed
- Vercel: Verify `vercel.json` is in project root
- Apache: Verify `.htaccess` is enabled (`AllowOverride All`)

### .well-known files not found?

- Some hosts block `.well-known` by default
- Check your hosting provider's settings
- May need to explicitly allow serving these files

## Next Steps

1. ✅ Build complete
2. 🚀 Deploy to hosting provider
3. ✅ Verify .well-known files are accessible
4. ✅ Test character sharing link
5. 📱 Rebuild mobile app with universal links enabled
6. 🧪 Test on real devices

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify network requests in DevTools
3. Test the backend endpoint directly:
   ```bash
   curl https://storyteller-backend-111768794939.europe-west3.run.app/characters/public/{id}/{shareCode}
   ```
