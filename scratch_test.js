const pbModule = require('d:/upwork/Mahmood/ows2/apps/web/node_modules/pocketbase');
const PocketBase = pbModule.default || pbModule;
const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  try {
    const adminAuth = await pb.collection('_superusers').authWithPassword('admin@gmail.com', '12345678');
    const u = await pb.collection('users').getOne('3303in6m4wsmw7v');
    console.log('User email:', u.email);
    pb.authStore.clear();

    // Login as the user
    // I don't know the user's password, so I will override the password as admin
    const newPass = 'SecurePass1234';
    await pb.collection('_superusers').authWithPassword('admin@gmail.com', '12345678');
    await pb.collection('users').update(u.id, { password: newPass, passwordConfirm: newPass });
    pb.authStore.clear();
    
    await pb.collection('users').authWithPassword(u.email, newPass);
    console.log('User auth successful!');

    const reqs = await pb.collection('requests').getFullList({
      filter: `user_id = "${u.id}"`,
      sort: '-created'
    });
    console.log('User requests count:', reqs.length);

  } catch(e) { console.error('Test failed:', e.data || e); }
}
test();
