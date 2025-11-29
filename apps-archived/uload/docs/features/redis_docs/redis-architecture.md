# Redis Cache Architecture

## System Overview

uload uses Redis as a high-performance caching layer to accelerate link redirects and reduce database load.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  SvelteKit  │────▶│    Redis    │
└─────────────┘     │   Server    │     └─────────────┘
                    └─────────────┘            │
                           │                   │ Cache Miss
                           │                   ▼
                           │            ┌─────────────┐
                           └───────────▶│  PocketBase │
                                       └─────────────┘
```

## Cache Implementation

### File Structure

```
src/lib/server/
├── redis.ts          # Redis client configuration and helpers
└── linkCache.ts      # Link-specific caching logic

src/routes/
├── [...slug]/
│   └── +page.server.ts  # Link redirect with cache
└── api/
    └── redis-status/
        └── +server.ts   # Redis health check endpoint
```

### Core Components

#### 1. Redis Client (`redis.ts`)

Provides a fault-tolerant Redis connection with automatic fallback:

```typescript
// Connection detection
const REDIS_ENABLED = !!(
  process.env.REDIS_HOST && 
  (process.env.REDIS_PASSWORD || process.env.NODE_ENV === 'development')
);

// Graceful degradation
if (!redis || !redisAvailable) return null;
```

#### 2. Link Cache (`linkCache.ts`)

Implements caching strategies for different link types:

```typescript
class LinkCache {
  // Fast redirect caching
  async getRedirectUrl(shortCode: string): Promise<string | null>
  async cacheRedirect(shortCode: string, targetUrl: string, popular: boolean)
  
  // Full object caching
  async cacheLink(link: Link): Promise<void>
  async getLink(shortCode: string): Promise<Link | null>
  
  // Cache management
  async invalidate(shortCode: string): Promise<void>
  async warmCache(links: Link[]): Promise<void>
}
```

## Cache Strategy

### TTL (Time To Live) Policy

| Content Type | TTL | Reason |
|-------------|-----|---------|
| Popular Links | 24 hours | Frequently accessed, rarely changed |
| Normal Links | 5 minutes | Balance between performance and freshness |
| User Link Lists | 5 minutes | May change frequently |
| Password-Protected | Never cached | Security requirement |
| Expired Links | Never cached | Would bypass expiration check |

### Cache Key Patterns

```
redirect:{shortCode}           # Direct URL for fast redirects
link:{shortCode}              # Full link object with metadata
clicks:{shortCode}            # Click counter
user:{userId}:links:page:{n}  # Paginated user links
trending:links                # Sorted set for analytics
test:ping                     # Health check key
```

### Cache Warming

Popular links are pre-loaded into cache on startup:

```typescript
async warmCache(links: Link[]): Promise<void> {
  for (const link of links) {
    await this.cacheRedirect(link.short_code, link.original_url, true);
  }
}
```

## Performance Optimization

### 1. Cache-First Strategy

```typescript
// Check cache first (fastest path)
const cachedUrl = await linkCache.getRedirectUrl(shortCode);
if (cachedUrl) {
  throw redirect(302, cachedUrl);
}

// Fall back to database
const link = await locals.pb.collection('links').getFirstListItem(...);
```

### 2. Async Cache Population

Cache writes are non-blocking to maintain low latency:

```typescript
// Cache for next time (non-blocking)
if (link.is_active && !link.password) {
  await linkCache.cacheRedirect(shortCode, link.original_url);
}
```

### 3. Trending Analytics

Click tracking without blocking redirects:

```typescript
// Async increment hit counter (non-blocking)
this.incrementHitCount(shortCode).catch(console.error);
```

## Fallback Mechanism

### Graceful Degradation

The system continues functioning without Redis:

1. **Detection**: Check Redis availability on startup
2. **Fallback**: Skip cache operations if unavailable
3. **Recovery**: Attempt reconnection periodically
4. **Logging**: Track cache availability for monitoring

### Error Handling

All cache operations are wrapped in try-catch blocks:

```typescript
try {
  await ensureRedisConnection();
  // Cache operations...
} catch (error) {
  console.error('Cache error:', error);
  return null; // Continue without cache
}
```

## Security Considerations

### 1. No Sensitive Data Caching

- Password-protected links bypass cache
- User authentication tokens never cached
- Personal data has minimal TTL

### 2. Cache Invalidation

Links are invalidated when:
- Link is updated
- Link is deleted
- Password protection added
- Expiration date reached

### 3. Rate Limiting

Redis enables efficient rate limiting:

```typescript
const key = `rate:${ip}:${endpoint}`;
const count = await cache.incr(key);
if (count === 1) {
  await cache.expire(key, 60); // 1 minute window
}
```

## Monitoring & Debugging

### Health Check Endpoint

`GET /api/redis-status`

```json
{
  "connected": true,
  "host": "localhost",
  "enabled": true,
  "available": true,
  "cachedLinks": 42,
  "error": null
}
```

### Console Logging

Development mode provides detailed logs:

```
✅ Redis: Connected successfully
Cache HIT! Redirecting from cache
Cache MISS - fetching from PocketBase
Cached redirect for future use
```

### Performance Metrics

Track cache effectiveness:

```typescript
// Hit rate calculation
const hits = await redis.get('stats:cache:hits') || 0;
const misses = await redis.get('stats:cache:misses') || 0;
const hitRate = hits / (hits + misses) * 100;
```

## Production Considerations

### 1. Memory Management

```bash
# Set max memory in Redis config
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 2. Persistence Options

```bash
# Disable persistence for cache-only use
save ""
appendonly no
```

### 3. Connection Pooling

```typescript
const redisConfig = {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: true
};
```

### 4. Monitoring Setup

- Use Redis INFO command for metrics
- Set up alerts for connection failures
- Monitor memory usage and eviction rate
- Track cache hit/miss ratio

## Scaling Strategies

### Horizontal Scaling

1. **Redis Cluster**: Distribute cache across nodes
2. **Read Replicas**: Separate read/write operations
3. **Sharding**: Partition by link patterns

### Vertical Scaling

1. **Memory**: Increase Redis memory allocation
2. **CPU**: Optimize for single-threaded performance
3. **Network**: Reduce latency with proximity

## Future Enhancements

### Planned Improvements

1. **Smart Preloading**: ML-based prediction of popular links
2. **Geolocation Caching**: CDN-style distributed cache
3. **Real-time Analytics**: Stream processing with Redis Streams
4. **Cache Warming API**: Admin endpoint for cache management
5. **A/B Testing**: Cache different versions for experiments

### Performance Goals

| Metric | Current | Target |
|--------|---------|--------|
| Cache Hit Rate | 70% | 90% |
| Redirect Latency | 20ms | 10ms |
| Memory Usage | 100MB | 50MB |
| TTL Optimization | Static | Dynamic |