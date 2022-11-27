import * as pg from 'pg';

const { Client } = pg.default;

export const client = new Client({
  database: 'fine',
  user: 'myuser',
  password: 'mypassword',
  port: 5432,
  host: 'localhost',
});
