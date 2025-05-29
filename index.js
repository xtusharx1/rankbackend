const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const cors = require('cors');
const http = require('http');

// Import routes
const rankTrackerRoutes = require('./routes/tracker');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Set JSON formatting for development
if (process.env.NODE_ENV === 'development') {
  app.set('json spaces', 2);
}

// Database sync
sequelize.sync()
    .then(() => console.log('Database synced'))
    .catch(err => console.error('Unable to sync database:', err));

const server = http.createServer(app);

// Routes
app.use('/api/rank-tracker', rankTrackerRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sainik School Rank Tracker API',
    version: '1.0.0',
    endpoints: {
      main: [
        'GET /api/rank-tracker/students - Get students list based on filters',
        'GET /api/rank-tracker/options - Get dropdown options for frontend'
      ]
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));