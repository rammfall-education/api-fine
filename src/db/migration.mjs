import { client } from '../initializers/database.mjs';
import { hash } from 'bcrypt';

export async function migration() {
  try {
    await client.query(
      "CREATE TYPE ROLES IF NOT EXISTS AS ENUM('admin', 'user');"
    );
  } catch (err) {}
  await client.query(`
        CREATE TABLE IF NOT EXISTS users(
          id SERIAL PRIMARY KEY,
          name VARCHAR(40) NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role ROLES default(\'user\')
        );
`);
  await client.query(`
      CREATE TABLE IF NOT EXISTS fines
      (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL DEFAULT(CURRENT_DATE),
        description TEXT NOT NULL,
        amount INTEGER NOT NULL,
        paid BOOLEAN DEFAULT (FALSE),
        adminid INTEGER NOT NULL,
        userid INTEGER NOT NULL,
        deadline DATE NOT NULL,
        FOREIGN KEY (adminid) REFERENCES users(id),
        FOREIGN KEY (userid) REFERENCES users(id)
      );
    `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS balance(
       id SERIAL PRIMARY KEY,
       amount INTEGER DEFAULT(0),
       userid INTEGER NOT NULL UNIQUE,
       FOREIGN KEY (userid) REFERENCES users(id)
    );
  `);
  const adminEmail = 'admin@rammfall.com';
  const { rows } = await client.query('SELECT * FROM users WHERE email=$1;', [
    adminEmail,
  ]);
  if (!rows.length) {
    await client.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4);',
      ['admin', adminEmail, await hash('admin1234', 10), 'admin']
    );
  }
}
