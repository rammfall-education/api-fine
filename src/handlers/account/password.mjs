import { compare, hash } from 'bcrypt';
import { Routes } from '../../constants/routes.mjs';
import { client } from '../../initializers/database.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';

/**
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 * @return {Promise<void>}
 */
const passwordHandler = async (request, reply) => {
  const { id } = request.payload;
  const { oldPassword, password } = request.body;
  const {
    rows: [user],
  } = await client.query('SELECT * FROM users WHERE id=$1;', [id]);
  if (await compare(oldPassword, user.password)) {
    const hashedPassword = await hash(password, 10);

    if (!(await compare(password, user.password))) {
      await client.query('UPDATE users SET password=$1 WHERE id=$2;', [hashedPassword, id]);

      return reply.send({ message: 'Password successful updated' });
    }

    return reply.status(402).send({ message: 'New password was compared with old' });
  }

  reply.status(400).send({ message: 'Old password is incorrect' });
};

export const accountPasswordConfig = [
  Routes.accountPassword,
  {
    schema: {
      description: 'Updating password of user',
      get summary() {
        return this.description;
      },
      tags: ['Profile'],
      headers: tokenValidationHeaderRule,
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
  passwordHandler,
];
