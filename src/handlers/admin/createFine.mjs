import { client } from '../../initializers/database.mjs';
import { Routes } from '../../constants/routes.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';

const createFine = async (request) => {
  const { id } = request.payload;
  const { userId, description, amount, deadline } = request.body;

  await client.query(
    'INSERT INTO fines (userid, description, amount, deadline, adminid) VALUES ($1, $2, $3, $4, $5);',
    [userId, description, amount, deadline, id]
  );

  return { message: 'Successful created fine' };
};

export const createFineConfig = [
  Routes.fine,
  {
    schema: {
      description: 'Create fine to user',
      get summary() {
        return this.description;
      },
      tags: ['Admin'],
      headers: tokenValidationHeaderRule,
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
            minimum: 1,
          },
          deadline: {
            type: 'string',
            format: 'date',
          },
        },
        required: ['userId', 'description', 'amount', 'deadline'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              default: 'Successful created fine',
            },
          },
          required: ['message'],
        },
      },
    },
  },
  createFine,
];
