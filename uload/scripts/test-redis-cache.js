#!/usr/bin/env node

import 'dotenv/config';
import { redis, cache, ensureRedisConnection } from './src/lib/server/redis.js';
import { linkCache } from './src/lib/server/linkCache.js';

console.log('🔍 Testing Redis Cache for Link Redirections\n');
console.log('==========================================\n');

async function testRedisConnection() {
	console.log('1. Testing Redis Connection...');
	const connected = await ensureRedisConnection();
	
	if (connected) {
		console.log('✅ Redis connected successfully');
		console.log(`   Host: ${process.env.REDIS_HOST || 'ycsoowwsc84s0s8gc8oooosk'}`);
		console.log(`   Port: ${process.env.REDIS_PORT || '6379'}\n`);
		return true;
	} else {
		console.log('❌ Redis connection failed\n');
		return false;
	}
}

async function testBasicCacheOperations() {
	console.log('2. Testing Basic Cache Operations...');
	
	// Test set and get
	const testKey = 'test:key';
	const testValue = { message: 'Hello Redis', timestamp: Date.now() };
	
	await cache.set(testKey, testValue, 60);
	console.log('   Set test value in cache');
	
	const retrieved = await cache.get(testKey);
	console.log('   Retrieved value:', retrieved);
	
	if (retrieved && retrieved.message === testValue.message) {
		console.log('✅ Basic cache operations working\n');
		
		// Clean up
		await cache.del(testKey);
		return true;
	} else {
		console.log('❌ Basic cache operations failed\n');
		return false;
	}
}

async function testLinkCaching() {
	console.log('3. Testing Link Cache Functions...');
	
	const testShortCode = 'test123';
	const testUrl = 'https://example.com/test';
	
	// Cache a redirect
	await linkCache.cacheRedirect(testShortCode, testUrl);
	console.log(`   Cached redirect: ${testShortCode} -> ${testUrl}`);
	
	// Try to retrieve it
	const cachedUrl = await linkCache.getRedirectUrl(testShortCode);
	console.log(`   Retrieved URL: ${cachedUrl}`);
	
	if (cachedUrl === testUrl) {
		console.log('✅ Link caching working correctly\n');
		
		// Clean up
		await linkCache.invalidate(testShortCode);
		return true;
	} else {
		console.log('❌ Link caching failed\n');
		return false;
	}
}

async function checkCachedLinks() {
	console.log('4. Checking Currently Cached Links...');
	
	try {
		// Get all keys matching redirect pattern
		const keys = await redis.keys('redirect:*');
		console.log(`   Found ${keys.length} cached redirects`);
		
		if (keys.length > 0) {
			console.log('\n   Sample cached links:');
			for (const key of keys.slice(0, 5)) {
				const url = await redis.get(key);
				const ttl = await redis.ttl(key);
				const shortCode = key.replace('redirect:', '');
				console.log(`   - ${shortCode}: ${url} (TTL: ${ttl}s)`);
			}
		}
		
		// Check trending links
		const trending = await linkCache.getTrendingLinks(5);
		if (trending.length > 0) {
			console.log('\n   Trending links:');
			trending.forEach((code, i) => {
				console.log(`   ${i + 1}. ${code}`);
			});
		}
		
		console.log('✅ Cache inspection complete\n');
		return true;
	} catch (error) {
		console.log('❌ Failed to inspect cache:', error.message, '\n');
		return false;
	}
}

async function performanceTest() {
	console.log('5. Performance Test (Cache vs No Cache)...');
	
	const testCode = 'perf-test';
	const testUrl = 'https://example.com/performance';
	
	// Test without cache (simulate)
	const dbStart = Date.now();
	await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB latency
	const dbTime = Date.now() - dbStart;
	console.log(`   Database fetch simulation: ${dbTime}ms`);
	
	// Cache the URL
	await linkCache.cacheRedirect(testCode, testUrl);
	
	// Test with cache
	const cacheStart = Date.now();
	await linkCache.getRedirectUrl(testCode);
	const cacheTime = Date.now() - cacheStart;
	console.log(`   Cache fetch: ${cacheTime}ms`);
	
	const improvement = Math.round((dbTime - cacheTime) / dbTime * 100);
	console.log(`   🚀 Performance improvement: ${improvement}%`);
	
	if (cacheTime < dbTime) {
		console.log('✅ Cache is faster than database\n');
	} else {
		console.log('⚠️  Cache performance needs investigation\n');
	}
	
	// Clean up
	await linkCache.invalidate(testCode);
	return true;
}

async function monitorLiveTraffic() {
	console.log('6. Monitoring Live Traffic (10 seconds)...');
	console.log('   Open your app and click some links to see cache activity\n');
	
	// Subscribe to Redis monitor for 10 seconds
	const monitor = await redis.monitor();
	let commandCount = 0;
	let cacheHits = 0;
	let cacheSets = 0;
	
	monitor.on('monitor', (time, args) => {
		const command = args[0];
		if (command === 'get' && args[1]?.includes('redirect:')) {
			cacheHits++;
			console.log(`   🎯 Cache GET: ${args[1]}`);
		} else if (command === 'setex' && args[1]?.includes('redirect:')) {
			cacheSets++;
			console.log(`   💾 Cache SET: ${args[1]} (TTL: ${args[2]}s)`);
		}
		commandCount++;
	});
	
	// Stop monitoring after 10 seconds
	await new Promise(resolve => setTimeout(resolve, 10000));
	monitor.disconnect();
	
	console.log(`\n   Monitoring complete:`);
	console.log(`   - Total Redis commands: ${commandCount}`);
	console.log(`   - Cache GETs: ${cacheHits}`);
	console.log(`   - Cache SETs: ${cacheSets}`);
	console.log('✅ Live monitoring complete\n');
	
	return true;
}

// Main test runner
async function runAllTests() {
	console.log('Starting Redis Cache Tests...\n');
	
	const tests = [
		testRedisConnection,
		testBasicCacheOperations,
		testLinkCaching,
		checkCachedLinks,
		performanceTest
	];
	
	let passed = 0;
	let failed = 0;
	
	for (const test of tests) {
		try {
			const result = await test();
			if (result) passed++;
			else failed++;
		} catch (error) {
			console.log(`❌ Test failed with error: ${error.message}\n`);
			failed++;
		}
	}
	
	console.log('==========================================');
	console.log(`Test Results: ${passed} passed, ${failed} failed`);
	
	// Optional: Run live monitoring
	console.log('\nWould you like to monitor live traffic? (Ctrl+C to skip)');
	console.log('Starting in 3 seconds...\n');
	
	await new Promise(resolve => setTimeout(resolve, 3000));
	
	try {
		await monitorLiveTraffic();
	} catch (error) {
		console.log('Monitoring cancelled');
	}
	
	// Close Redis connection
	redis.disconnect();
	process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
	console.error('Test suite failed:', error);
	redis.disconnect();
	process.exit(1);
});