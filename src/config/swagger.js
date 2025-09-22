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
      description: 'API documentation for Gravitas project',
    },
    servers: [
      {
        url: URL,
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
  ], //UPDATE IF MAKING SEPARATE FOLDER FOR SCOTLAND YARD
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
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
