import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyFormBody from '@fastify/formbody';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { ROUTE_PREFIX } from './constants/routes.mjs';
import { auth } from './hooks/auth.mjs';
import { loginConfig } from './handlers/auth/login.mjs';
import { registerConfig } from './handlers/auth/register.mjs';
import { accountEmailConfig } from './handlers/account/email.mjs';
import { accountPasswordConfig } from './handlers/account/password.mjs';
import { usersConfig } from './handlers/admin/users.mjs';
import { createFineConfig } from './handlers/admin/createFine.mjs';
import { getFinesConfig } from './handlers/user/fines.mjs';
import { getBalanceConfig } from './handlers/balance/getBalance.mjs';
import { topUpConfig } from './handlers/balance/topUp.mjs';
import { payFineConfig } from './handlers/user/payFine.mjs';
import { adminFinesConfig } from './handlers/admin/fines.mjs';
import { requestToDiscardConfig } from './handlers/user/requestToDiscard.mjs';
import { changeFineStatusConfig } from './handlers/admin/changeFineStatus.mjs';

const server = fastify({
  logger: true,
  ajv: {
    customOptions: {
      allErrors: true,
    },
  },
});

server.register(fastifyCors);
server.register(fastifyMultipart, {
  addToBody: true,
});
server.register(fastifyCookie);
server.register(fastifyCsrf);
server.register(fastifyFormBody);
server.register(fastifySwagger);
server.register(fastifySwaggerUi, {});

server.register(
  (instance, opts, done) => {
    instance.addHook('preHandler', auth);

    instance.post(...registerConfig);
    instance.post(...loginConfig);
    instance.patch(...accountEmailConfig);
    instance.patch(...accountPasswordConfig);
    instance.get(...usersConfig);
    instance.post(...createFineConfig);
    instance.get(...getFinesConfig);
    instance.get(...getBalanceConfig);
    instance.post(...topUpConfig);
    instance.patch(...payFineConfig);
    instance.get(...adminFinesConfig);
    instance.patch(...requestToDiscardConfig);
    instance.patch(...changeFineStatusConfig);

    done();
  },
  {
    prefix: ROUTE_PREFIX,
  }
);

export default server;
