# Stripe Deployment Setup

## Required Environment Variables

Add these to your deployment platform (e.g., Coolify):

```bash
# Stripe API Keys (Test)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RujJlPRtmsJbOMgKRJu4uOqOGzGXwI8FT0qwf1jJUQ0HJIDmxBR3fzJSqGhVQCJ5xAJ4jKh0U6JvfLdx76FpMGB00xQI2j4qg

# Stripe Product Configuration
STRIPE_PRODUCT_ID=prod_SrqNlCbfaaKSnk
STRIPE_PRICE_MONTHLY=price_1Rw6hkPRtmsJbOMgdUYfj7ee
STRIPE_PRICE_YEARLY=price_1Rw6j0PRtmsJbOMgTGrOZH2c
STRIPE_PRICE_LIFETIME=price_1Rw6qPPRtmsJbOMgsS6nnBTM
```

## Finding Your Values

1. **API Keys**: Stripe Dashboard → Developers → API Keys
2. **Product ID**: Stripe Dashboard → Products → Select product → Copy ID
3. **Price IDs**: Stripe Dashboard → Products → Select product → Pricing section → Copy price IDs

## Important Notes

- Use test keys (`sk_test_`, `pk_test_`) for development
- Use live keys (`sk_live_`, `pk_live_`) for production
- All variables must be set or checkout will fail with "Price ID not found"
- Restart application after adding variables
