# Matrix SSO Integration

This document describes how Mana Core Auth provides Single Sign-On (SSO) for Matrix/Synapse using OpenID Connect (OIDC).

## Overview

Mana Core Auth acts as an **OIDC Provider** (Identity Provider), allowing Matrix Synapse to authenticate users via SSO. Users can sign in to Matrix using their Mana Core credentials.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Matrix Client  │────▶│     Synapse     │────▶│  Mana Core Auth │
│    (Element)    │     │  (matrix.mana.how) │  │  (auth.mana.how) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │  1. Click "SSO"      │                       │
         │─────────────────────▶│                       │
         │                      │  2. Redirect to       │
         │                      │     OIDC authorize    │
         │                      │──────────────────────▶│
         │                      │                       │
         │                      │  3. Show login page   │
         │◀─────────────────────────────────────────────│
         │                      │                       │
         │  4. User logs in     │                       │
         │─────────────────────────────────────────────▶│
         │                      │                       │
         │                      │  5. Redirect with     │
         │                      │     auth code         │
         │                      │◀──────────────────────│
         │                      │                       │
         │                      │  6. Exchange code     │
         │                      │     for tokens        │
         │                      │──────────────────────▶│
         │                      │                       │
         │  7. Login complete   │◀──────────────────────│
         │◀─────────────────────│                       │
```

## OIDC Endpoints

Mana Core Auth exposes the following OIDC endpoints:

| Endpoint | URL | Description |
|----------|-----|-------------|
| Discovery | `https://auth.mana.how/.well-known/openid-configuration` | OIDC discovery document |
| Authorize | `https://auth.mana.how/api/auth/oauth2/authorize` | Authorization endpoint |
| Token | `https://auth.mana.how/api/auth/oauth2/token` | Token endpoint |
| UserInfo | `https://auth.mana.how/api/auth/oauth2/userinfo` | User info endpoint |
| JWKS | `https://auth.mana.how/api/auth/jwks` | JSON Web Key Set |
| Login | `https://auth.mana.how/login` | SSO login page |

## Synapse Configuration

The Matrix Synapse server is configured with OIDC in `docker/matrix/homeserver.yaml`:

```yaml
oidc_providers:
  - idp_id: manacore
    idp_name: "Mana Core"
    idp_brand: "org.matrix.custom"
    discover: true
    issuer: "https://auth.mana.how"
    client_id: "matrix-synapse"
    client_secret: "<secret>"
    scopes: ["openid", "profile", "email"]
    user_mapping_provider:
      config:
        subject_claim: "sub"
        localpart_template: "{{ user.email.split('@')[0] }}"
        display_name_template: "{{ user.name }}"
        email_template: "{{ user.email }}"
```

## OAuth Application Registration

The Matrix Synapse client is registered in the auth database:

```sql
INSERT INTO auth.oauth_applications (
  id, name, client_id, client_secret, redirect_urls, type
) VALUES (
  'matrix-synapse-client',
  'Matrix Synapse',
  'matrix-synapse',
  '<hashed-secret>',
  '["https://matrix.mana.how/_synapse/client/oidc/callback"]',
  'web'
);
```

## Authentication Flow

1. **User initiates SSO**: User clicks "Sign in with Mana Core" on Element/Matrix client
2. **Synapse redirects**: Synapse redirects to Mana Core Auth's authorization endpoint
3. **Login page**: If not logged in, user sees the Mana Core login page
4. **User authenticates**: User enters email and password
5. **Authorization**: After successful login, user is redirected back to authorization endpoint
6. **Token exchange**: Synapse exchanges the authorization code for tokens
7. **User mapping**: Synapse creates/links the Matrix user based on OIDC claims
8. **Login complete**: User is logged into Matrix

## Claims Provided

The OIDC tokens include the following claims:

| Claim | Description |
|-------|-------------|
| `sub` | User ID |
| `email` | User's email address |
| `email_verified` | Whether email is verified |
| `name` | User's display name |

## Testing the Integration

### Test OIDC Discovery

```bash
curl https://auth.mana.how/.well-known/openid-configuration | jq
```

### Test Matrix SSO Redirect

```bash
curl -I "https://matrix.mana.how/_matrix/client/v3/login/sso/redirect/oidc-manacore?redirectUrl=https://element.mana.how"
```

### Check Matrix Login Methods

```bash
curl https://matrix.mana.how/_matrix/client/v3/login | jq '.flows[] | select(.type | contains("sso"))'
```

Expected output:
```json
{
  "type": "m.login.sso",
  "identity_providers": [
    {
      "id": "oidc-manacore",
      "name": "Mana Core",
      "brand": "org.matrix.custom"
    }
  ]
}
```

## Troubleshooting

### JWKS Fetch Fails

If Synapse can't fetch JWKS:
1. Check JWKS endpoint: `curl https://auth.mana.how/api/auth/jwks`
2. Verify Synapse can reach auth service (network/DNS)
3. Check Synapse logs for OIDC errors

### Login Page Not Found

If the login page returns 404:
1. Check that `/login` is excluded from global prefix in `main.ts`
2. Verify `OidcLoginController` is registered in `AuthModule`

### Authorization Fails

If authorization returns errors:
1. Check client_id matches registered OAuth application
2. Verify redirect_uri matches exactly (including trailing slash)
3. Check that required scopes are requested

### Token Exchange Fails

If token exchange fails:
1. Check client_secret is correct
2. Verify token endpoint is accessible
3. Check Synapse logs for detailed error messages

## Security Considerations

1. **Client Secret**: The OAuth client secret is stored securely and should never be exposed
2. **HTTPS Only**: All OIDC endpoints use HTTPS
3. **Token Expiry**: ID tokens expire after 15 minutes
4. **PKCE**: Authorization code flow uses PKCE for added security

## Related Files

| File | Purpose |
|------|---------|
| `src/auth/better-auth.config.ts` | OIDC Provider plugin configuration |
| `src/auth/oidc.controller.ts` | OIDC endpoint routing |
| `src/auth/oidc-login.controller.ts` | SSO login page |
| `src/db/schema/auth.schema.ts` | OAuth tables (oauth_applications, etc.) |
| `docker/matrix/homeserver.yaml` | Synapse OIDC configuration |
