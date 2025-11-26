# Redis Cache - Local Development Setup

## Overview

Redis is used in uload to dramatically improve link redirect performance by caching frequently accessed links. This guide covers setting up Redis for local development.

## Prerequisites

- macOS with Homebrew installed
- Node.js 18+ 
- Running uload development environment

## Installation

### 1. Install Redis via Homebrew

```bash
# Install Redis
brew install redis

# Start Redis as a background service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 2. Configure Environment Variables

Add the following to your `.env.development` file:

```env
# Redis Configuration (Local Development)
REDIS_HOST=localhost
REDIS_PORT=6379
# No password needed for local Redis
REDIS_PASSWORD=
```

### 3. Verify Connection

Start your development server with Redis environment variables:

```bash
# Option 1: If .env.development is loaded automatically
npm run dev

# Option 2: With explicit environment variables
REDIS_HOST=localhost REDIS_PORT=6379 npm run dev
```

Check the console output for:
```
✅ Redis: Connected successfully
```

### 4. Test Redis Status

Visit the Redis status endpoint:

```bash
curl http://localhost:5173/api/redis-status | jq
```

Expected response:
```json
{
  "connected": true,
  "host": "localhost",
  "enabled": true,
  "available": true,
  "cachedLinks": 0,
  "error": null
}
```

## How It Works

### Cache Flow

1. **First Visit (Cache MISS)**
   ```
   User → Short Link → Check Redis (miss) → Query Database → Redirect → Cache Result
   ```
   - Takes ~100-200ms
   - Stores result in Redis for future requests

2. **Subsequent Visits (Cache HIT)**
   ```
   User → Short Link → Check Redis (hit) → Redirect
   ```
   - Takes ~10-20ms
   - Skips database query entirely

### Cache Keys Structure

```
redirect:{shortCode}     # Stores the target URL for quick redirects
link:{shortCode}        # Stores full link object
clicks:{shortCode}      # Stores click count
user:{userId}:links:page:{n}  # Cached user link pages
trending:links          # Sorted set of trending links
```

## Development Workflow

### 1. Monitor Redis Activity

Watch real-time Redis commands:

```bash
redis-cli monitor
```

### 2. View Cached Links

```bash
# List all cached redirects
redis-cli keys "redirect:*"

# Get specific redirect
redis-cli get "redirect:abc123"

# Check TTL (time to live)
redis-cli ttl "redirect:abc123"
```

### 3. Clear Cache

```bash
# Clear all Redis data
redis-cli flushall

# Clear specific key
redis-cli del "redirect:abc123"
```

### 4. Debug Cache Hits/Misses

Enable verbose logging in your browser console:
1. Visit a short link
2. Check browser console for:
   - "Cache MISS - fetching from PocketBase"
   - "Cache HIT! Redirecting from cache"

## Testing

### Run Test Suite

```bash
# Test local Redis connection
node test-local-redis.mjs

# Comprehensive cache test
node test-redis-cache.mjs
```

### Manual Testing

1. Create a short link in the app
2. Visit the link (first time = cache miss)
3. Visit again (second time = cache hit, faster)
4. Check `/api/redis-status` to see cached links count

## Configuration Options

### Cache TTL (Time To Live)

Edit `src/lib/server/linkCache.ts`:

```typescript
const CACHE_TTL = 86400;  // 24 hours for popular links
const SHORT_TTL = 300;    // 5 minutes for normal links
```

### Fallback Behavior

The app automatically handles Redis unavailability:
- If Redis is down, the app continues working without cache
- No errors shown to users
- Graceful degradation to database-only mode

## Troubleshooting

### Redis Won't Start

```bash
# Check if Redis is already running
ps aux | grep redis

# Check Redis service status
brew services list

# Restart Redis
brew services restart redis

# Check Redis logs
tail -f /opt/homebrew/var/log/redis.log
```

### Connection Refused

1. Verify Redis is running:
   ```bash
   redis-cli ping
   ```

2. Check port availability:
   ```bash
   lsof -i :6379
   ```

3. Ensure environment variables are set:
   ```bash
   echo $REDIS_HOST
   echo $REDIS_PORT
   ```

### Cache Not Working

1. Check Redis connection in app:
   ```bash
   curl http://localhost:5173/api/redis-status
   ```

2. Verify Redis has memory available:
   ```bash
   redis-cli info memory
   ```

3. Check for Redis errors in console output

### Performance Issues

1. Monitor Redis latency:
   ```bash
   redis-cli --latency
   ```

2. Check Redis memory usage:
   ```bash
   redis-cli info memory | grep used_memory_human
   ```

3. Clear old cache data:
   ```bash
   redis-cli flushall
   ```

## Redis CLI Commands Reference

```bash
# Basic Commands
redis-cli ping                    # Test connection
redis-cli info                     # Server information
redis-cli monitor                  # Watch commands in real-time
redis-cli config get "*"           # Show all configuration

# Key Operations
redis-cli keys "*"                 # List all keys (careful in production!)
redis-cli get key                  # Get value
redis-cli set key value            # Set value
redis-cli del key                  # Delete key
redis-cli exists key               # Check if key exists
redis-cli ttl key                  # Time to live in seconds
redis-cli expire key seconds       # Set expiration

# Maintenance
redis-cli flushdb                  # Clear current database
redis-cli flushall                 # Clear all databases
redis-cli dbsize                   # Number of keys
redis-cli lastsave                 # Last save timestamp

# Performance
redis-cli --latency                # Measure latency
redis-cli --latency-history        # Latency over time
redis-cli slowlog get              # Show slow queries
```

## Best Practices

1. **Don't Cache Sensitive Data**
   - Password-protected links are never cached
   - User-specific data has short TTLs

2. **Monitor Memory Usage**
   - Redis uses in-memory storage
   - Set appropriate max memory limits in production

3. **Use Appropriate TTLs**
   - Short TTL for frequently changing data
   - Long TTL for static content

4. **Handle Cache Invalidation**
   - Clear cache when links are updated
   - Implement cache warming for popular links

## Next Steps

- [Production Redis Setup](./redis-production-setup.md)
- [Cache Strategy Guide](./cache-strategy.md)
- [Performance Optimization](./performance.md)