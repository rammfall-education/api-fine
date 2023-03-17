import { Routes } from '../../constants/routes.mjs';
import { FINE_STATUSES_ENUM } from '../../constants/statuses.mjs';
import { client } from '../../initializers/database.mjs';

export const changeFineStatusConfig = [
  Routes.status,
  {
    schema: {
      tags: ['Admin'],
      description: 'Change status fine',
      get summary() {
        return this.description;
      },
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: [FINE_STATUSES_ENUM.requested, FINE_STATUSES_ENUM.canceled],
          },
        },
        required: ['status'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              default: 'Success status change',
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              default: 'Not correct status or not existing fine',
            },
          },
        },
      },
    },
  },
  async (request, reply) => {
    const { id: userId } = request.payload;
    const { id } = request.params;
    const { status } = request.body;
    const {
      rows: [user],
    } = await client.query("SELECT * FROM users WHERE id=$1 AND role='admin';", [userId]);

    if (user) {
      const {
        rows: [fine],
      } = await client.query("SELECT * FROM fines WHERE id=$1 AND status='pending';", [id]);

      if (fine) {
        await client.query('UPDATE fines SET status=$1 WHERE id=$2;', [status, id]);

        return {
          message: 'Success status change',
        };
      }

      reply.status(400);
      return {
        message: 'Not correct status or not existing fine',
      };
    }
    reply.status(404);
    return {
      message: 'Not correct role',
    };
  },
];
