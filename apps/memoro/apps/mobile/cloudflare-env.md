# Cloudflare Pages Environment Variables

Diese Environment Variables müssen in Cloudflare Pages konfiguriert werden:

## Production Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://npgifbrwhftlbrbaglmi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HlAZpB4BxXaMcfOCNx6VJA_-64NTxu4
EXPO_PUBLIC_MIDDLEWARE_APP_ID=973da0c1-b479-4dac-a1b0-ed09c72caca8

EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL=https://memoro-service-111768794939.europe-west3.run.app
EXPO_PUBLIC_MANA_MIDDLEWARE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app

EXPO_PUBLIC_GOOGLE_CLIENT_ID=624477741877-67or55qpi440mlg1t46e178ta2gmcll9.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=624477741877-5dm8kmb2ol1u6mekjd5h1onsgnc36o7u.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=624477741877-nhal104mkgu36d1n1c9dhsunp2cer4k8.apps.googleusercontent.com

EXPO_PUBLIC_REVENUECAT_IOS_KEY=rcb_sb_sMFArrsRKvJFRGFTyxvGKQfdq
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_KttzasFElOuXcgUOSkpiYoTdORM
EXPO_PUBLIC_REVENUECAT_WEB_PUBLIC_KEY_DEV=rcb_sb_sMFArrsRKvJFRGFTyxvGKQfdq
EXPO_PUBLIC_REVENUECAT_WEB_PUBLIC_KEY_PROD=rcb_pMWEUAeYFdAfDhkkJjBuyrLnnFsS

EXPO_PUBLIC_STORAGE_BUCKET=user-uploads

EXPO_PUBLIC_POSTHOG_KEY=phc_SdmYfeCIZDgIfj87SNCpId18a5edPqtnmam6f0H4dWJ
EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

## Cloudflare Pages Build Settings

**Build command:**
```bash
npm run web:build
```

**Build output directory:**
```
web-build
```

**Node version:**
```
18
```

## Setup Instructions

1. Go to Cloudflare Pages Dashboard
2. Select your project (or create new)
3. Go to Settings → Environment variables
4. Add all variables above for Production environment
5. Optional: Create Preview environment with dev values

## Important Notes

- All variables must start with `EXPO_PUBLIC_` to be available in the client
- RevenueCat Web SDK keys must be Web-specific (not iOS/Android keys)
- Make sure to get the correct Production Web SDK key from RevenueCat Dashboard