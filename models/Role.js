const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Assuming this is where sequelize is configured

const Role = sequelize.define('Role', {
  role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'Roles',  // Table name
  timestamps: false,   // Assuming no timestamps are required
});

module.exports = Role;
