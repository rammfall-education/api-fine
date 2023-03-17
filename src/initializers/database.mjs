import * as dotenv from 'dotenv';
import * as pg from 'pg';

dotenv.config();

const { Client } = pg.default;

export const client = new Client({
  connectionString:
    process.env.PSQL_CONNECTION || 'postgresql://myuser:mypassword@localhost:5432/fine',
});
