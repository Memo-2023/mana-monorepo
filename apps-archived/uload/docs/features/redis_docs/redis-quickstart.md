# Redis Cache - Quick Start Guide

## 🚀 5-Minute Setup

### macOS/Linux

```bash
# 1. Install Redis
brew install redis

# 2. Start Redis
brew services start redis

# 3. Add to .env.development
echo "REDIS_HOST=localhost" >> .env.development
echo "REDIS_PORT=6379" >> .env.development
echo "REDIS_PASSWORD=" >> .env.development

# 4. Start app
npm run dev

# 5. Verify
curl http://localhost:5173/api/redis-status
```

### Windows (WSL2)

```bash
# 1. Install Redis in WSL2
sudo apt update
sudo apt install redis-server

# 2. Start Redis
sudo service redis-server start

# 3. Configure (same as macOS)
```

### Docker

```bash
# 1. Run Redis container
docker run -d -p 6379:6379 --name uload-redis redis:alpine

# 2. Configure (same as above)
```

## ✅ Verify It's Working

### Check Connection

```bash
# Should return: PONG
redis-cli ping
```

### Check App Status

Visit: http://localhost:5173/api/redis-status

Should see:

```json
{
	"connected": true,
	"available": true
}
```

### Test Cache Performance

1. Create a short link
2. Visit it (slow - cache miss)
3. Visit again (fast - cache hit!)
4. Check console for "Cache HIT!" message

## 🛠 Common Commands

```bash
# View all cached links
redis-cli keys "redirect:*"

# Clear cache
redis-cli flushall

# Monitor activity
redis-cli monitor

# Stop Redis
brew services stop redis
```

## 🔥 Quick Tips

1. **No Password Locally**: Leave REDIS_PASSWORD empty for local dev
2. **Auto-Fallback**: App works without Redis (just slower)
3. **Hot Reload**: Changes to Redis config need server restart
4. **Memory**: Redis uses ~50MB for thousands of links

## 📚 Learn More

- [Detailed Setup Guide](./redis-local-setup.md)
- [Architecture Overview](./redis-architecture.md)
- [Production Setup](./redis-production-setup.md)

## 🆘 Help

**Redis won't start?**

```bash
brew services restart redis
```

**Connection refused?**

```bash
# Check if running
ps aux | grep redis
```

**Cache not working?**

- Check console for Redis connection message
- Verify environment variables are loaded
- Try explicit env vars: `REDIS_HOST=localhost npm run dev`
