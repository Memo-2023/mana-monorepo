import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb.ulo.ad');

async function test() {
	try {
		console.log('Testing connection to PocketBase Production...');

		// Test 1: Get all users
		const users = await pb.collection('users').getList(1, 10);
		console.log('Found users:', users.items.length);
		users.items.forEach((u) => console.log(`  - username: "${u.username}" (${u.email})`));

		// Test 2: Find specific user
		try {
			const user = await pb.collection('users').getFirstListItem('username="memoro"');
			console.log('\nFound specific user:', user.username, user.id);

			// Test 3: Get folders for user
			const folders = await pb.collection('folders').getList(1, 50, {
				filter: `user_id="${user.id}" && is_public=true`,
			});
			console.log('Public folders:', folders.items.length);

			// Test 4: Get links for user
			const links = await pb.collection('links').getList(1, 100, {
				filter: `user_id="${user.id}" && is_active=true`,
			});
			console.log('Active links:', links.items.length);
		} catch (err) {
			console.log('\nCould not find user "memoro"');
			console.log('Error:', err.message);
		}
	} catch (err) {
		console.error('Error:', err.message);
		console.error('Full error:', err);
	}
}

test();
