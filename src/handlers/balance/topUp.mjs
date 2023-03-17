import { Routes } from '../../constants/routes.mjs';
import { client } from '../../initializers/database.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';

export const topUpConfig = [
  Routes.topUp,
  {
    schema: {
      tags: ['Balance'],
      description: 'Top up balance',
      headers: tokenValidationHeaderRule,
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
      response: {
        200: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              default: 'Success',
            },
          },
          required: ['message'],
        },
      },
    },
  },
  async (request, reply) => {
    const { id } = request.payload;
    const { amount } = request.body;

    await client.query('UPDATE balance SET amount=amount + $1 WHERE userid=$2;', [amount, id]);
    reply.send({ message: 'Success' });
  },
];
