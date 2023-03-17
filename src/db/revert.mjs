import { client } from '../initializers/database.mjs';

export async function revertMigration() {
  await client.connect();
  await client.query('DROP TABLE balance;');
  await client.query('DROP TABLE fines;');
  await client.query('DROP TABLE users;');
  await client.end();
}

revertMigration()
  .then(() => console.log('Successfully reverted'))
  .catch((err) => console.log(err.message));
