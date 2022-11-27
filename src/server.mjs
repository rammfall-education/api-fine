import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyFormBody from '@fastify/formbody';
import { compare, hash } from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { client } from './initializers/database.mjs';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

const { sign, verify } = jwt.default;
const server = fastify({
  logger: true,
  ajv: {
    customOptions: {
      allErrors: true,
    },
  },
});
const SECRET_WORD = 'SECRet';

server.register(fastifyCors);
server.register(fastifyMultipart, {
  addToBody: true,
});
server.register(fastifyCookie);
server.register(fastifyCsrf);
server.register(fastifyFormBody);
server.register(fastifySwagger);
server.register(fastifySwaggerUi, {});

server.get('/', (request, reply) => {
  reply.send({ obj: 'test' });
});

server.register(
  (instance, opts, done) => {
    instance.addHook('preHandler', async function (request, reply) {
      if (['/api/login', '/api/register'].includes(request.url)) {
        return;
      }
      const { token } = request.headers;
      try {
        const payload = await verify(token, SECRET_WORD);
        request.payload = payload;
      } catch (err) {
        reply.status(401).send({ message: 'Unauthorized' });
      }
    });

    instance.post(
      '/register',
      {
        schema: {
          tags: ['Auth'],
          description: 'Creating account of user',
          get summary() {
            return this.description;
          },
          body: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of user',
                minLength: 4,
                maxLength: 40,
              },
              email: {
                type: 'string',
                description: 'Email of user',
                minLength: 6,
                maxLength: 50,
              },
              password: {
                description: 'Password of user',
                type: 'string',
                minLength: 8,
                maxLength: 50,
              },
            },
            required: ['email', 'password', 'name'],
          },
          response: {
            201: {
              type: 'object',
              description: 'Successful registered user',
              properties: {
                message: {
                  type: 'string',
                  default: 'User successful created',
                },
              },
              required: ['message'],
            },
            400: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'Error when user already exists',
                },
              },
              required: ['message'],
              description: 'Error when user already exists',
            },
          },
        },
      },
      async (request, reply) => {
        const { name, email, password } = request.body;
        const { rows } = await client.query(
          'SELECT * FROM users WHERE email=$1;',
          [email]
        );

        if (rows.length === 0) {
          const hashedPassword = await hash(password, 10);

          await client.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3);',
            [name, email, hashedPassword]
          );
          return reply.status(201).send({ message: 'User successful created' });
        }

        return reply.status(400).send({ message: 'User already exists' });
      }
    );

    instance.post(
      '/login',
      {
        schema: {
          tags: ['Auth'],
          description: 'Logging user',
          get summary() {
            return this.description;
          },
          body: {
            type: 'object',
            properties: {
              email: {
                description: 'Email of user',
                type: 'string',
                minLength: 6,
                maxLength: 50,
              },
              password: {
                description: 'Password of user',
                type: 'string',
                minLength: 8,
                maxLength: 50,
              },
            },
            required: ['email', 'password'],
          },
          response: {
            200: {
              description: 'Successful logged in account',
              type: 'object',
              required: ['token', 'email'],
              properties: {
                token: {
                  type: 'string',
                  default:
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                },
                email: {
                  type: 'string',
                  default: 'test@test.com',
                },
              },
            },
            400: {
              description: 'If you try login to not existed user',
              type: 'object',
              properties: {
                message: { type: 'string', default: 'User does not exit' },
              },
            },
            403: {
              description: 'If you try login with invalid password',
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'Your password in incorrect',
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const { email, password } = request.body;
        const {
          rows: [user],
        } = await client.query('SELECT * FROM users WHERE email=$1;', [email]);

        if (user) {
          if (await compare(password, user.password)) {
            const token = await sign(
              { email: user.email, id: user.id },
              SECRET_WORD,
              {
                expiresIn: '2h',
              }
            );

            return reply.send({ token, email });
          }

          return reply
            .status(403)
            .send({ message: 'Your password in incorrect' });
        }

        return reply.status(400).send({ message: 'User does not exit' });
      }
    );

    instance.patch(
      '/account/email',
      {
        schema: {
          tags: ['Profile'],
          description: 'Updating email user',
          get summary() {
            return this.description;
          },
          body: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                minLength: 6,
                maxLength: 40,
              },
            },
            required: ['email'],
          },
          response: {
            200: {
              description: 'When email updated successful',
              type: 'object',
              properties: {
                email: { type: 'string', default: 'test@test.test' },
              },
            },
            400: {
              description: 'When email was occupied',
              type: 'object',
              properties: {
                message: { type: 'string', default: 'Email already exist' },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const { email } = request.body;
        const { id } = request.payload;
        const {
          rows: [user],
        } = await client.query('SELECT * FROM users WHERE email=$1;', [email]);

        if (!user) {
          await client.query('UPDATE users SET email=$1 WHERE id=$2;', [
            email,
            id,
          ]);

          return reply.send({ email });
        }

        reply.status(400).send({ message: 'Email already exist' });
      }
    );

    instance.patch(
      '/account/password',
      {
        schema: {
          description: 'Updating password of user',
          get summary() {
            return this.description;
          },
          tags: ['Profile'],
          body: {
            type: 'object',
            properties: {
              oldPassword: {
                description: 'Old password of user',
                type: 'string',
                minLength: 8,
                maxLength: 50,
              },
              password: {
                description: 'Password of user',
                type: 'string',
                minLength: 8,
                maxLength: 50,
              },
            },
            required: ['password', 'oldPassword'],
          },
          response: {
            200: {
              description: 'When password updated successful',
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'Password successful updated',
                },
              },
            },
            402: {
              description: 'When old password the same with new',
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'New password was compared with old',
                },
              },
            },
            400: {
              description: 'When password is incorrect',
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'Old password is incorrect',
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const { id } = request.payload;
        const { oldPassword, password } = request.body;
        const {
          rows: [user],
        } = await client.query('SELECT * FROM users WHERE id=$1;', [id]);
        if (await compare(oldPassword, user.password)) {
          const hashedPassword = await hash(password, 10);

          if (!(await compare(password, user.password))) {
            await client.query('UPDATE users SET password=$1 WHERE id=$2;', [
              hashedPassword,
              id,
            ]);

            return reply.send({ message: 'Password successful updated' });
          }

          return reply
            .status(402)
            .send({ message: 'New password was compared with old' });
        }

        reply.status(400).send({ message: 'Old password is incorrect' });
      }
    );

    instance.get(
      '/users',
      {
        schema: {
          tags: ['Admin'],
          querystring: {
            type: 'object',
            properties: {
              search: {
                type: 'string',
                minLength: 2,
                maxLength: 40,
              },
            },
          },
          response: {
            200: {
              description: 'All users with user role',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                  },
                  email: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                },
              },
            },
            404: {
              description: 'When user have not correct rights',
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'You dont have correct rights',
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const { search = '' } = request.query;
        const { id } = request.payload;
        const {
          rows: [user],
        } = await client.query(
          "SELECT * FROM users WHERE id=$1 AND role='admin';",
          [id]
        );

        if (user) {
          const { rows: users } = await client.query(
            `SELECT * FROM users WHERE role='user';`
          );
          return reply.send(
            users.filter(({ name }) => {
              return name.toLowerCase().includes(search.toLowerCase());
            })
          );
        }

        reply.status(404).send({ message: 'You dont have correct rights' });
      }
    );

    instance.post(
      '/fine',
      {
        schema: {
          tags: ['Admin'],
          body: {
            type: 'object',
            properties: {
              userId: {
                type: 'number',
              },
              description: {
                type: 'string',
              },
              amount: {
                type: 'number',
              },
              deadline: {
                type: 'string',
              },
            },
            required: ['userId', 'description', 'amount', 'deadline'],
          },
        },
      },
      async (request, reply) => {
        const { id } = request.payload;
        const { userId, description, amount, deadline } = request.body;

        await client.query(
          'INSERT INTO fines (userid, description, amount, deadline, adminid) VALUES ($1, $2, $3, $4, $5);',
          [userId, description, amount, deadline, id]
        );
        reply.send({ message: 'Successful created fine' });
      }
    );

    done();
  },
  {
    prefix: '/api',
  }
);

export default server;
