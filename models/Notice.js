const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notice = sequelize.define('Notice', {
  notice_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('individual', 'batch'),
    allowNull: false,
  },
  recipients: {
    type: DataTypes.JSONB, // This can be an array or object
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'Notices',
  timestamps: false,
});

module.exports = Notice;
