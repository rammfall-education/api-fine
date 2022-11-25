import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyFormBody from '@fastify/formbody';

const server = fastify({
  logger: true,
});

server.register(fastifyCors);
server.register(fastifyMultipart, {
  addToBody: true,
});
server.register(fastifyCookie);
server.register(fastifyCsrf);
server.register(fastifyFormBody);

server.get('/', (request, reply) => {
  reply.send({ obj: 'test' });
});

export default server;
