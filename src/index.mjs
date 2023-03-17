import * as dotenv from 'dotenv';
import server from './server.mjs';
import { client } from './initializers/database.mjs';

dotenv.config();

server
  .listen({
    port: process.env.PORT || 3001,
    host: '0.0.0.0',
  })
  .then(() => client.connect())
  .catch((err) => {
    console.log(err);
  });
