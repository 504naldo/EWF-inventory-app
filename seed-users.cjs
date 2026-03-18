const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection('mysql://root:nPeJmFNhOCPopTmPWFkSGNiuXalDaTVX@trolley.proxy.rlwy.net:41235/railway');
  const hash = 'c121e25bb29a1d0d055df1c09bed2b93:4075ae90a7490e975c58e10a42ebd4d1b97b9e3f3e1c40cfa312113089287178eead724a4eafe73f7c07aa198378d856be188aaf859dfe0685bd2eaff5807f67';
  const users = [
    ['local-ranaldo', 'Ranaldo', 'ranaldo@ewandf.ca', 'admin'],
    ['local-russ', 'Russ', 'russ@ewandf.ca', 'tech'],
    ['local-craig', 'Craig', 'craig@ewandf.ca', 'tech'],
    ['local-tony', 'Tony', 'tony@ewandf.ca', 'tech'],
    ['local-markus', 'Markus', 'markus@ewandf.ca', 'tech'],
    ['local-myblock', 'MyBlock', 'myblock2183@gmail.com', 'admin'],
    ['local-jeff', 'Jeff', 'jeff@ewandf.ca', 'admin'],
  ];
  for (const [openId, name, email, role] of users) {
    const sql = "INSERT INTO users (openId, name, email, password, role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = ?, role = ?";
    const [result] = await conn.execute(sql, [openId, name, email, hash, role, hash, role]);
    console.log('OK ' + name + ':', result.affectedRows, 'rows');
  }
  await conn.end();
  console.log('\nAll 7 users created successfully!');
}
run().catch(e => console.error('ERROR:', e.message));
