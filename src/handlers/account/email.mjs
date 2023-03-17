import { Routes } from '../../constants/routes.mjs';
import { client } from '../../initializers/database.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';

/**
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 */
const emailHandler = async (request, reply) => {
  const { email } = request.body;
  const { id } = request.payload;
  const {
    rows: [user],
  } = await client.query('SELECT * FROM users WHERE email=$1;', [email]);

  if (!user) {
    await client.query('UPDATE users SET email=$1 WHERE id=$2;', [email, id]);

    return { email };
  }

  reply.status(400);
  return { message: 'Email already exist' };
};

export const accountEmailConfig = [
  Routes.accountEmail,
  {
    schema: {
      tags: ['Profile'],
      description: 'Updating email user',
      get summary() {
        return this.description;
      },
      headers: tokenValidationHeaderRule,
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
  emailHandler,
];
