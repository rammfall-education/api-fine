import { hash } from 'bcrypt';
import { client } from '../../initializers/database.mjs';
import { Routes } from '../../constants/routes.mjs';

/**
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 * @return {Promise<void>}
 */
const registerHandler = async (request, reply) => {
  const { name, email, password } = request.body;
  const { rows } = await client.query('SELECT * FROM users WHERE email=$1;', [email]);

  if (rows.length === 0) {
    const hashedPassword = await hash(password, 10);
    await client.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3);', [
      name,
      email,
      hashedPassword,
    ]);
    const {
      rows: [{ id }],
    } = await client.query('SELECT * FROM users WHERE email=$1;', [email]);
    await client.query('INSERT INTO balance (userid) VALUES ($1);', [id]);
    return reply.status(201).send({ message: 'User successful created' });
  }

  return reply.status(400).send({
    message: 'User with this email already exists',
    field: 'email',
  });
};

export const registerConfig = [
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
  registerHandler,
];
