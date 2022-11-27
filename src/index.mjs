import server from './server.mjs';
import { client } from './initializers/database.mjs';
import { migration } from './db/migration.mjs';

server
  .listen({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
  })
  .then(() => client.connect())
  .then(() => {
    return migration();
  })
  .catch((err) => {
    console.log(err);
  });
