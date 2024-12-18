const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User'); // Import User model
const FeePaymentRecord = require('./FeePaymentRecord'); // Import FeePaymentRecord model
const OtherChargesRecord = require('./OtherChargesRecord'); // Import OtherChargesRecord model

const FeeStatus = sequelize.define('FeeStatus', {
  admissionDate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalFees: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  feesSubmitted: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  remainingFees: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nextDueDate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_id: {  // Foreign key column for User
    type: DataTypes.INTEGER,
    references: {
      model: User, // Reference the User model
      key: 'user_id', // Assuming the primary key of the User table is 'id'
    },
    onDelete: 'CASCADE', // Optionally, define the deletion behavior
    allowNull: false,
  },
});


module.exports = FeeStatus;
