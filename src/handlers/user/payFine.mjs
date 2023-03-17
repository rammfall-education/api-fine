import { Routes } from '../../constants/routes.mjs';
import { client } from '../../initializers/database.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';

export const payFineConfig = [
  Routes.specificFine,
  {
    schema: {
      tags: ['User'],
      description: 'Pay a fine',
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
    } = await client.query('SELECT * FROM balance WHERE userid=$1;', [userId]);
    const {
      rows: [fine],
    } = await client.query('SELECT * FROM fines WHERE id=$1 AND userid=$2;', [fineId, userId]);
    if (fine) {
      if (fine.amount <= amount) {
        await client.query('UPDATE balance SET amount=amount - $1 WHERE userid=$2;', [
          fine.amount,
          userId,
        ]);
        await client.query(`UPDATE fines SET status='completed' WHERE id=$1`, [fineId]);

        return reply.send({ message: 'Fine has been paid successfully' });
      }

      return reply.status(400).send({ message: 'Not enough money' });
    }

    return reply.status(404).send({ message: 'Fine does not exist' });
  },
];
