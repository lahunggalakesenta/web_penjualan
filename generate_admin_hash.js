// generate_admin_hash.js
const bcrypt = require('bcrypt');

const password = 'admin123'; // ubah kalau mau password lain

bcrypt.hash(password, 10).then(hash => {
    console.log('\n✅ Hash password admin berhasil dibuat!\n');
    console.log('Password asli :', password);
    console.log('Hash hasilnya :', hash);
    console.log('\nSalin hash di atas dan jalankan query SQL berikut di phpMyAdmin:');
    console.log(`UPDATE users SET password='${hash}' WHERE username='admin';\n`);
});
