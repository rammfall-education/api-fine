import server from './server.mjs';

server
  .listen({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
  })
  .then(() => {})
  .catch((err) => {
    console.log(err);
  });
