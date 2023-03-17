import { hash } from 'bcrypt';
import { client } from '../initializers/database.mjs';

export async function migration() {
  try {
    await client.query("CREATE TYPE ROLES AS ENUM('admin', 'user');");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Roles enum already exists');
  }
  try {
    await client.query(
      `CREATE TYPE STATUS AS ENUM('canceled', 'completed', 'pending', 'requested');`
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('Status enum already exists');
  }
  await client.query(`
        CREATE TABLE IF NOT EXISTS users(
          id SERIAL PRIMARY KEY,
          name VARCHAR(40) NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role ROLES default('user')
        );
  `);
  await client.query(`
      CREATE TABLE IF NOT EXISTS fines
      (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL DEFAULT(CURRENT_DATE),
        description TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status STATUS DEFAULT ('requested'),
        adminid INTEGER NOT NULL,
        userid INTEGER NOT NULL,
        deadline DATE NOT NULL,
        FOREIGN KEY (adminid) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
      );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS balance(
       id SERIAL PRIMARY KEY,
       amount INTEGER DEFAULT(0),
       userid INTEGER NOT NULL UNIQUE,
       FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  const adminEmail = 'admin@rammfall.com';
  const { rows } = await client.query('SELECT * FROM users WHERE email=$1;', [adminEmail]);
  if (!rows.length) {
    await client.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4);', [
      'admin',
      adminEmail,
      await hash('admin1234', 10),
      'admin',
    ]);
  }
}

client
  .connect()
  .then(() => migration())
  // eslint-disable-next-line no-console
  .then(() => console.log('successfully migrated'))
  // eslint-disable-next-line no-console
  .catch((err) => console.log(err.message))
  .then(() => client.end());
