import { client } from '../../initializers/database.mjs';
import { Routes } from '../../constants/routes.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';

/**
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 */
const usersHandler = async (request, reply) => {
  const { search = '' } = request.query;
  const { id } = request.payload;
  const {
    rows: [user],
  } = await client.query("SELECT * FROM users WHERE id=$1 AND role='admin';", [id]);

  if (user) {
    const { rows: users } = await client.query(`SELECT * FROM users WHERE role='user';`);
    return reply.send(
      users.filter(({ name }) => name.toLowerCase().includes(search.toLowerCase()))
    );
  }

  reply.status(404);
  return { message: 'You dont have correct rights' };
};

export const usersConfig = [
  Routes.users,
  {
    schema: {
      description: 'Get all users',
      get summary() {
        return this.description;
      },
      tags: ['Admin'],
      headers: tokenValidationHeaderRule,
      querystring: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search user by his name',
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
  usersHandler,
];
