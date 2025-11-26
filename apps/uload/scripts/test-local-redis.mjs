#!/usr/bin/env node

import Redis from 'ioredis';

console.log('🔍 Testing Local Redis Connection\n');
console.log('==================================\n');

// Local Redis configuration
const redis = new Redis({
	host: 'localhost',
	port: 6379,
	// No password for local Redis
});

async function testConnection() {
	try {
		// Test ping
		const pong = await redis.ping();
		console.log('✅ Redis is running locally!');
		console.log(`   Response: ${pong}`);
		
		// Test set/get
		await redis.set('test:local', 'Hello from local Redis!');
		const value = await redis.get('test:local');
		console.log(`   Test value: ${value}`);
		
		// Clean up
		await redis.del('test:local');
		
		console.log('\n✅ All tests passed! Local Redis is working.');
		console.log('\n📝 Next steps:');
		console.log('   1. Run "npm run dev" to start the app');
		console.log('   2. Visit a short link');
		console.log('   3. Check console for "Redis: Connected successfully"');
		console.log('   4. Refresh the link - should be faster (cache hit)');
		
	} catch (error) {
		console.error('❌ Redis connection failed:', error.message);
		console.log('\nTroubleshooting:');
		console.log('   1. Check if Redis is running: brew services list');
		console.log('   2. Start Redis: brew services start redis');
		console.log('   3. Test connection: redis-cli ping');
	} finally {
		redis.disconnect();
	}
}

testConnection();