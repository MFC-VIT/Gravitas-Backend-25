const app = require('./app');
const logger = require('./utils/logger');
const dotenv = require('dotenv');

// Load env from root
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});
