import * as dotenv from 'dotenv';
dotenv.config();
import * as pg from 'pg';

const { Client } = pg.default;

export const client = new Client({
  connectionString:
    process.env.PSQL_CONNECTION ||
    'postgresql://myuser:mypassword@localhost:5432/fine',
});
