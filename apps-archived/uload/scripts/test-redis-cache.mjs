#!/usr/bin/env node

import Redis from 'ioredis';

console.log('🔍 Testing Redis Cache for Link Redirections\n');
console.log('==========================================\n');

// Redis Configuration (same as in your app)
const redisConfig = {
	host: process.env.REDIS_HOST || 'ycsoowwsc84s0s8gc8oooosk',
	port: parseInt(process.env.REDIS_PORT || '6379'),
	username: process.env.REDIS_USERNAME || 'default',
	password: process.env.REDIS_PASSWORD,
	retryDelayOnFailover: 100,
	maxRetriesPerRequest: 3
};

const redis = new Redis(redisConfig);

// Helper functions
const cache = {
	async get(key) {
		const value = await redis.get(key);
		return value ? JSON.parse(value) : null;
	},
	async set(key, value, ttlSeconds = 3600) {
		await redis.setex(key, ttlSeconds, JSON.stringify(value));
	},
	async del(key) {
		await redis.del(key);
	}
};

async function testRedisConnection() {
	console.log('1. Testing Redis Connection...');
	
	try {
		await redis.ping();
		console.log('✅ Redis connected successfully');
		console.log(`   Host: ${redisConfig.host}`);
		console.log(`   Port: ${redisConfig.port}\n`);
		return true;
	} catch (error) {
		console.log('❌ Redis connection failed:', error.message);
		console.log('   Make sure Redis is running and credentials are correct\n');
		return false;
	}
}

async function testBasicCacheOperations() {
	console.log('2. Testing Basic Cache Operations...');
	
	const testKey = 'test:key';
	const testValue = { message: 'Hello Redis', timestamp: Date.now() };
	
	try {
		await cache.set(testKey, testValue, 60);
		console.log('   ✓ Set test value in cache');
		
		const retrieved = await cache.get(testKey);
		console.log('   ✓ Retrieved value:', retrieved);
		
		if (retrieved && retrieved.message === testValue.message) {
			console.log('✅ Basic cache operations working\n');
			await cache.del(testKey);
			return true;
		} else {
			console.log('❌ Value mismatch in cache\n');
			return false;
		}
	} catch (error) {
		console.log('❌ Cache operation failed:', error.message, '\n');
		return false;
	}
}

async function testLinkCaching() {
	console.log('3. Testing Link Redirect Cache...');
	
	const testShortCode = 'test123';
	const testUrl = 'https://example.com/test';
	const cacheKey = `redirect:${testShortCode}`;
	
	try {
		// Cache a redirect (directly as string, not JSON)
		await redis.setex(cacheKey, 300, testUrl);
		console.log(`   ✓ Cached redirect: ${testShortCode} -> ${testUrl}`);
		
		// Retrieve it
		const cachedUrl = await redis.get(cacheKey);
		console.log(`   ✓ Retrieved URL: ${cachedUrl}`);
		
		if (cachedUrl === testUrl) {
			console.log('✅ Link caching working correctly\n');
			await redis.del(cacheKey);
			return true;
		} else {
			console.log('❌ Link cache retrieval failed\n');
			return false;
		}
	} catch (error) {
		console.log('❌ Link caching failed:', error.message, '\n');
		return false;
	}
}

async function checkCachedLinks() {
	console.log('4. Checking Currently Cached Links...');
	
	try {
		// Get all redirect keys
		const keys = await redis.keys('redirect:*');
		console.log(`   Found ${keys.length} cached redirects`);
		
		if (keys.length > 0) {
			console.log('\n   Sample cached links (max 5):');
			for (const key of keys.slice(0, 5)) {
				const url = await redis.get(key);
				const ttl = await redis.ttl(key);
				const shortCode = key.replace('redirect:', '');
				console.log(`   - ${shortCode}: ${url?.substring(0, 50)}... (TTL: ${ttl}s)`);
			}
		} else {
			console.log('   No cached redirects found (this is normal if cache is cold)');
		}
		
		// Check trending links
		const trending = await redis.zrevrange('trending:links', 0, 4);
		if (trending.length > 0) {
			console.log('\n   Trending links:');
			trending.forEach((code, i) => {
				console.log(`   ${i + 1}. ${code}`);
			});
		} else {
			console.log('   No trending data yet');
		}
		
		console.log('✅ Cache inspection complete\n');
		return true;
	} catch (error) {
		console.log('❌ Failed to inspect cache:', error.message, '\n');
		return false;
	}
}

async function performanceTest() {
	console.log('5. Performance Test (Cache vs Simulated DB)...');
	
	const testCode = 'perf-test';
	const testUrl = 'https://example.com/performance';
	const cacheKey = `redirect:${testCode}`;
	
	try {
		// Simulate database fetch
		const dbStart = Date.now();
		await new Promise(resolve => setTimeout(resolve, 50));
		const dbTime = Date.now() - dbStart;
		console.log(`   Database fetch simulation: ${dbTime}ms`);
		
		// Cache the URL
		await redis.setex(cacheKey, 300, testUrl);
		
		// Test cache fetch
		const cacheStart = Date.now();
		await redis.get(cacheKey);
		const cacheTime = Date.now() - cacheStart;
		console.log(`   Cache fetch: ${cacheTime}ms`);
		
		const improvement = Math.round((dbTime - cacheTime) / dbTime * 100);
		console.log(`   🚀 Performance improvement: ~${improvement}%`);
		
		if (cacheTime < dbTime) {
			console.log('✅ Cache is significantly faster\n');
		} else {
			console.log('⚠️  Cache performance unexpected\n');
		}
		
		await redis.del(cacheKey);
		return true;
	} catch (error) {
		console.log('❌ Performance test failed:', error.message, '\n');
		return false;
	}
}

async function testRealLink() {
	console.log('6. Testing with Real Application Flow...');
	
	console.log('   Instructions:');
	console.log('   1. Start your app: npm run dev');
	console.log('   2. Visit a short link in your browser');
	console.log('   3. Check the console output for cache HIT/MISS messages');
	console.log('   4. Refresh the same link - should show "Cache HIT!"\n');
	
	// Check if any real links are cached
	const realKeys = await redis.keys('redirect:*');
	if (realKeys.length > 0) {
		console.log('   Currently cached real links:');
		for (const key of realKeys.slice(0, 3)) {
			const ttl = await redis.ttl(key);
			console.log(`   - ${key} (expires in ${ttl}s)`);
		}
	}
	
	console.log('✅ Ready for real-world testing\n');
	return true;
}

// Main test runner
async function runAllTests() {
	const tests = [
		testRedisConnection,
		testBasicCacheOperations,
		testLinkCaching,
		checkCachedLinks,
		performanceTest,
		testRealLink
	];
	
	let passed = 0;
	let failed = 0;
	
	for (const test of tests) {
		try {
			const result = await test();
			if (result) passed++;
			else failed++;
		} catch (error) {
			console.log(`❌ Test crashed: ${error.message}\n`);
			failed++;
		}
	}
	
	console.log('==========================================');
	console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
	
	if (passed === tests.length) {
		console.log('🎉 All tests passed! Redis cache is working correctly.');
	} else if (failed === tests.length) {
		console.log('⚠️  All tests failed. Check your Redis configuration.');
	} else {
		console.log('⚠️  Some tests failed. Review the output above.');
	}
	
	console.log('\n💡 Tips for verifying cache in production:');
	console.log('   - Check server logs for "Cache HIT!" messages');
	console.log('   - First visit: "Cache MISS" + redirect');
	console.log('   - Second visit: "Cache HIT!" + faster redirect');
	console.log('   - Cache TTL: 5 min (unpopular) or 24h (popular links)');
	
	redis.disconnect();
	process.exit(failed > 0 ? 1 : 0);
}

// Handle errors
redis.on('error', (err) => {
	console.error('Redis connection error:', err.message);
	console.error('Make sure Redis is running and accessible');
	process.exit(1);
});

// Run tests
console.log('Connecting to Redis...\n');
runAllTests().catch(error => {
	console.error('Test suite failed:', error);
	redis.disconnect();
	process.exit(1);
});