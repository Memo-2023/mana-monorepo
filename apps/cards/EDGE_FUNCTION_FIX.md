# Edge Function Authentication Fix

## Problem

The Edge Function tries to validate Mana app tokens as Supabase JWTs using `supabase.auth.getUser()`, but Mana tokens are signed by a different Supabase project and need to be verified using the JWKS endpoint.

## Solution

Update the Edge Function to verify Mana tokens using the jose library and JWKS:

```typescript
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		// Get the authorization header
		const authHeader = req.headers.get('Authorization');
		if (!authHeader) {
			throw new Error('No authorization header');
		}

		// Extract the Mana app token
		const appToken = authHeader.replace('Bearer ', '');

		// Get Mana Core JWKS URL from environment variable
		// This should be: https://your-mana-project.supabase.co/auth/v1/.well-known/jwks.json
		const manaJwksUrl = Deno.env.get('MANA_JWKS_URL');
		if (!manaJwksUrl) {
			throw new Error('MANA_JWKS_URL not configured');
		}

		// Verify the Mana token using JWKS
		const JWKS = jose.createRemoteJWKSet(new URL(manaJwksUrl));
		const { payload } = await jose.jwtVerify(appToken, JWKS);

		const userId = payload.sub as string;
		if (!userId) {
			throw new Error('Invalid token: no user ID');
		}

		console.log(`Authenticated user: ${userId}`);

		// Initialize Supabase client with service role
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Use the userId from the Mana token
		const user = { id: userId };

		// Parse request body
		const requestData = await req.json();
		const {
			prompt: userPrompt,
			deckTitle,
			deckDescription = '',
			cardCount = 10,
			cardTypes = ['flashcard', 'quiz'],
			difficulty = 'intermediate',
			tags = [],
		} = requestData;

		// Validate input
		if (!userPrompt || !deckTitle) {
			throw new Error('userPrompt and deckTitle are required');
		}
		if (cardCount < 1 || cardCount > 50) {
			throw new Error('cardCount must be between 1 and 50');
		}

		// Continue with OpenAI call and rest of your existing function code...
	} catch (error) {
		console.error('Error in generate-deck function:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
			}),
			{
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json',
				},
				status: error.message?.includes('authorization') ? 401 : 400,
			}
		);
	}
});
```

## Critical: Disable Gateway JWT Verification

The Supabase Edge Gateway tries to validate JWTs before passing requests to your function. Since you're using Mana Core JWTs (not Cards JWTs), you need to disable this.

Create `supabase/functions/generate-deck/config.toml`:

```toml
# Disable automatic JWT verification by Supabase Edge Gateway
# We'll manually verify the Mana Core JWT inside the function
verify_jwt = false
```

Do the same for `generate-deck-from-image`:

```toml
# supabase/functions/generate-deck-from-image/config.toml
verify_jwt = false
```

## Environment Variables Needed

Add this to your Supabase Edge Function secrets:

```bash
# Get your Mana Core project reference from the Supabase dashboard
supabase secrets set MANA_JWKS_URL=https://zvwwwwtcmhnxcjiswrln.supabase.co/auth/v1/.well-known/jwks.json
```

Replace `zvwwwwtcmhnxcjiswrln` with your actual Mana Core Supabase project reference.

## How It Works

1. ✅ Receives Mana app token from Authorization header
2. ✅ Verifies token signature using Mana Core JWKS endpoint
3. ✅ Validates token expiration automatically (jose handles this)
4. ✅ Extracts user ID from verified token payload
5. ✅ Uses Supabase service role for database operations
6. ✅ Associates created decks with the correct user ID

## Benefits

- Properly validates asymmetric ECC P-256 signed JWTs
- Handles key rotation automatically via JWKS
- More secure than manual JWT decoding
- Works with Supabase's new JWT signing keys
