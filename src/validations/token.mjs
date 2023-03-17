export const tokenValidationHeaderRule = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
      description: 'JWT token',
    },
  },
  required: ['token'],
};
