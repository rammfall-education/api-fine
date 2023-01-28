import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyFormBody from '@fastify/formbody';
import { compare, hash } from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { format, isAfter, isBefore } from 'date-fns';
import { client } from './initializers/database.mjs';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import {
  NotProtectedRoutesList,
  ROUTE_PREFIX,
  Routes,
} from './constants/routes.mjs';
import { auth } from './hooks/auth.mjs';
import { SECRET_WORD } from './config/index.mjs';

const { sign } = jwt.default;
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

server.get('/', (request, reply) => {
  reply.send({ obj: 'test' });
});

server.register(
  (instance, opts, done) => {
    instance.addHook('preHandler', auth);

    instance.post(
      Routes.register,
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
                field: {
                  type: 'string',
                  default: 'email',
                },
              },
              required: ['message', 'field'],
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
          const {
            rows: [{ id }],
          } = await client.query('SELECT * FROM users WHERE email=$1;', [
            email,
          ]);
          await client.query('INSERT INTO balance (userid) VALUES ($1);', [id]);
          return reply.status(201).send({ message: 'User successful created' });
        }

        return reply.status(400).send({
          message: 'User with this email already exists',
          field: 'email',
        });
      }
    );

    instance.post(
      Routes.login,
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
              required: ['token', 'email', 'role'],
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
                role: {
                  type: 'string',
                  default: 'ADMIN',
                  description: 'Type can be admin or user',
                },
              },
            },
            400: {
              description: 'If you try login to not existed user',
              type: 'object',
              properties: {
                message: { type: 'string', default: 'User does not exit' },
                field: { type: 'string', default: 'email' },
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
                field: { type: 'string', default: 'password' },
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
                expiresIn: '24h',
              }
            );

            return reply.send({ token, email, role: user.role });
          }

          return reply
            .status(403)
            .send({ message: 'Your password in incorrect', field: 'password' });
        }

        return reply.status(400).send({
          message: 'User with this email does not exit',
          field: 'email',
        });
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
          description: 'Get all users',
          get summary() {
            return this.description;
          },
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
          description: 'Create fine to user',
          get summary() {
            return this.description;
          },
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

    instance.get(
      Routes.fines,
      {
        schema: {
          tags: ['User'],
          description: 'Get all fines by filter',
          get summary() {
            return this.description;
          },
          querystring: {
            type: 'object',
            properties: {
              dateFrom: {
                type: 'string',
                format: 'date',
              },
              dateTo: {
                type: 'string',
                format: 'date',
              },
              paid: {
                type: 'boolean',
                default: false,
              },
            },
          },
          response: {
            200: {
              description: 'Array of fines',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                  },
                  description: {
                    type: 'string',
                  },
                  deadline: {
                    type: 'string',
                    format: 'datetime',
                  },
                  date: {
                    type: 'string',
                    format: 'datetime',
                  },
                  amount: {
                    type: 'number',
                  },
                  paid: {
                    type: 'boolean',
                  },
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const {
          dateFrom = format(new Date(2020, 0, 1), 'yyyy-MM-dd'),
          dateTo = format(new Date(2023, 0, 1), 'yyyy-MM-dd'),
          paid,
        } = request.query;
        const validatedDateFrom = new Date(dateFrom);
        const validatedDateTo = new Date(dateTo);
        const { id } = request.payload;
        const { rows: fines } = await client.query(
          'SELECT * FROM fines WHERE userid=$1 AND paid=$2;',
          [id, paid]
        );
        console.log(id);
        const filteredFines = fines.filter(({ deadline }) => {
          const deadlineDate = new Date(deadline);
          return (
            isAfter(deadlineDate, validatedDateFrom) &&
            isBefore(deadlineDate, validatedDateTo)
          );
        });

        reply.send(filteredFines);
      }
    );

    instance.get(
      Routes.balance,
      {
        schema: {
          description: 'Get balance',
          get summary() {
            return this.description;
          },
          tags: ['Balance'],
          response: {
            200: {
              description: 'Balance of user',
              type: 'object',
              properties: {
                balance: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const { id } = request.payload;
        const {
          rows: [{ amount }],
        } = await client.query('SELECT * FROM balance WHERE userid=$1;', [id]);

        reply.send({ balance: amount });
      }
    );

    instance.post(
      Routes.topUp,
      {
        schema: {
          tags: ['Balance'],
          description: 'Top up balance',
          get summary() {
            return this.description;
          },
          body: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
                minimum: 1,
                maximum: 1000000,
              },
            },
            required: ['amount'],
          },
        },
      },
      async (request, reply) => {
        const { id } = request.payload;
        const { amount } = request.body;

        await client.query(
          'UPDATE balance SET amount=amount + $1 WHERE userid=$2;',
          [amount, id]
        );
        reply.send({ message: 'Success' });
      }
    );

    instance.patch(
      '/pay/fine/:id',
      {
        schema: {
          tags: ['User'],
          description: 'Pay a fine',
          get summary() {
            return this.description;
          },
          params: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
              },
            },
            required: ['id'],
          },
          response: {
            200: {
              description: 'Success payed fine',
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'Fine has been paid successfully',
                },
              },
            },
            400: {
              description: 'Not enough money',
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'Not enough money',
                },
              },
            },
            404: {
              description: 'Fine does not exist',
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  default: 'Fine does not exist',
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        const { id: userId } = request.payload;
        const { id: fineId } = request.params;

        const {
          rows: [{ amount }],
        } = await client.query('SELECT * FROM balance WHERE userid=$1;', [
          userId,
        ]);
        const {
          rows: [fine],
        } = await client.query('SELECT * FROM fines WHERE id=$1;', [fineId]);
        if (fine) {
          if (fine.amount <= amount) {
            await client.query(
              'UPDATE balance SET amount=amount - $1 WHERE userid=$2;',
              [fine.amount, userId]
            );
            await client.query('UPDATE fines SET paid=TRUE WHERE id=$1', [
              fineId,
            ]);

            return reply.send({ message: 'Fine has been paid successfully' });
          }

          return reply.status(400).send({ message: 'Not enough money' });
        }

        reply.status(404).send({ message: 'Fine does not exist' });
      }
    );

    done();
  },
  {
    prefix: ROUTE_PREFIX,
  }
);

export default server;
