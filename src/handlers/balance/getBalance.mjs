import { Routes } from '../../constants/routes.mjs';
import { client } from '../../initializers/database.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';

export const getBalanceConfig = [
  Routes.balance,
  {
    schema: {
      description: 'Get balance',
      get summary() {
        return this.description;
      },
      tags: ['Balance'],
      headers: tokenValidationHeaderRule,
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
  },
];
