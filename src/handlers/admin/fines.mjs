import { Routes } from '../../constants/routes.mjs';
import { client } from '../../initializers/database.mjs';
import { FINE_STATUSES } from '../../constants/statuses.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';

export const adminFinesConfig = [
  Routes.adminFines,
  {
    schema: {
      description: 'Get all fines by admin',
      get summary() {
        return this.description;
      },
      tags: ['Admin'],
      headers: tokenValidationHeaderRule,
      query: {
        type: 'object',
        properties: {
          statuses: {
            type: 'array',
            items: { enum: FINE_STATUSES },
            description: 'Select statuses for searching',
            maxItems: 4,
          },
          description: {
            type: 'string',
            description: 'Search by description',
            minLength: 1,
            maxLength: 30,
          },
        },
      },
      response: {
        400: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
          },
          required: ['message'],
        },
        200: {
          type: 'object',
          properties: {
            fines: {
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
                  status: {
                    type: 'string',
                  },
                },
              },
            },
          },
          required: ['fines'],
        },
      },
    },
  },
  async (request, reply) => {
    const { id } = request.payload;
    const { statuses = FINE_STATUSES, description = '' } = request.query;
    const {
      rows: [admin],
    } = await client.query("SELECT * FROM users WHERE id=$1 AND role='admin'", [id]);

    if (admin) {
      const { rows: fines } = await client.query('SELECT * FROM fines;');

      return {
        fines: fines.filter(
          (fine) =>
            statuses.includes(fine.status) &&
            fine.description.toLowerCase().includes(description.toLowerCase())
        ),
      };
    }

    reply.status(400);
    return {
      message: 'This user is not admin',
    };
  },
];
