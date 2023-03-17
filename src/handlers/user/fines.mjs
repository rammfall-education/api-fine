import { addYears, format, isAfter, isBefore } from 'date-fns';

import { client } from '../../initializers/database.mjs';
import { Routes } from '../../constants/routes.mjs';
import { tokenValidationHeaderRule } from '../../validations/token.mjs';
import { FINE_STATUSES } from '../../constants/statuses.mjs';

const getFines = async (request) => {
  const {
    dateFrom = format(new Date(0), 'yyyy-MM-dd'),
    dateTo = format(addYears(new Date(), 3), 'yyyy-MM-dd'),
    statuses = FINE_STATUSES,
  } = request.query;
  const validatedDateFrom = new Date(dateFrom);
  const validatedDateTo = new Date(dateTo);
  const { id } = request.payload;
  const { rows: fines } = await client.query('SELECT * FROM fines WHERE userid=$1;', [id]);
  return fines.filter(({ deadline, status }) => {
    const deadlineDate = new Date(deadline);
    return (
      isAfter(deadlineDate, validatedDateFrom) &&
      isBefore(deadlineDate, validatedDateTo) &&
      statuses.includes(status)
    );
  });
};

export const getFinesConfig = [
  Routes.fines,
  {
    schema: {
      tags: ['User'],
      description: 'Get all fines by filter',
      get summary() {
        return this.description;
      },
      headers: tokenValidationHeaderRule,
      querystring: {
        type: 'object',
        properties: {
          dateFrom: {
            type: 'string',
            format: 'date',
          },
          dateTo: {
            type: 'string',
            format: 'date',
          },
          statuses: {
            type: 'array',
            items: { enum: FINE_STATUSES },
            description: 'Select statuses for searching',
            maxItems: 4,
          },
        },
      },
      response: {
        200: {
          description: 'Array of fines',
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
    },
  },
  getFines,
];
