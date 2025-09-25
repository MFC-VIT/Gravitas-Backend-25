const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const URL = process.env.BE_URL || 'http://localhost:3000'; // Update for deployment
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gravitas API',
      version: '1.0.0',
      description:
        'API documentation for Gravitas project - includes Auth, Teams, Scotland Yard, and Jeopardy games',
      contact: {
        name: 'Gravitas Team',
        email: 'support@gravitas.com',
      },
    },
    servers: [
      {
        url: URL,
        description: 'Main server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'string',
              description: 'Additional error details',
            },
          },
        },
        Team: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Team ID',
            },
            name: {
              type: 'string',
              description: 'Team name',
            },
            code: {
              type: 'string',
              description: 'Team join code',
            },
            leaderId: {
              type: 'integer',
              description: 'Team leader user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // globs pointing to route/controller files
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './jeopardy/routes/*.js',
    './jeopardy/controllers/*.js',
    './scotland-yard/routes/*.js',
    './scotland-yard/controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = swaggerDocs;
