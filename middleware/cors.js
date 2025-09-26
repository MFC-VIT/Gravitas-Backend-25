const cors = require('cors');

const corsOptions = {
  origin: ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
};

module.exports = cors(corsOptions);
