import { test } from 'uvu';
import { equal } from 'uvu/assert';

import server from '../../server.mjs';
import { client } from '../../initializers/database.mjs';

test('login feature', async () => {
  await client.connect();

  const response = await server.inject({
    method: 'POST',
    url: '/api/login',
    payload: {
      email: 'admin@rammfall.com',
      password: 'admin1234',
    },
  });

  equal(response.statusCode, 200, 'Success response status');
  equal(JSON.parse(response.body).email, 'admin@rammfall.com', 'Correct response');

  await client.end();
});

test.run();
