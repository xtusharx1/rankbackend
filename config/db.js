const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

// Create a new Sequelize instance with the database configuration
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true, // Enforce SSL connection
            rejectUnauthorized: false, // Allow self-signed certificates
        },
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL queries in development only
});

// Test the database connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err.message || err);
    });

// Export the Sequelize instance for use in other files
module.exports = sequelize;
