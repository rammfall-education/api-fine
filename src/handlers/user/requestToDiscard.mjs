import { Routes } from '../../constants/routes.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';
import { client } from '../../initializers/database.mjs';

export const requestToDiscardConfig = [
  Routes.discard,
  {
    schema: {
      tags: ['User'],
      description: 'Try to discard the fine',
      get summary() {
        return this.description;
      },
      headers: tokenValidationHeaderRule,
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
          type: 'object',
          properties: {
            message: {
              type: 'string',
              default: 'Successful requested',
            },
          },
          required: ['message'],
        },
        400: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              default: 'Fine not exist or status not correct',
            },
          },
          required: ['message'],
        },
      },
    },
  },
  async (request, reply) => {
    const { id: userId } = request.payload;
    const { id } = request.params;

    const {
      rows: [fine],
    } = await client.query(
      "SELECT * FROM fines WHERE userid=$1 AND id=$2 AND status='requested';",
      [userId, id]
    );

    if (fine) {
      await client.query("UPDATE fines SET status='pending' WHERE id=$1;", [id]);

      return {
        message: 'Successful requested',
      };
    }

    reply.status(400);
    return {
      message: 'Fine not exist or status not correct',
    };
  },
];
