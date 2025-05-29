const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Class9 = sequelize.define('Class9', {
  sl_no: {
    type: DataTypes.INTEGER,
    allowNull: true,
    primaryKey: true,
  },
  class: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  roll: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  appno: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  candidate_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  domicile: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  total_marks: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  air_rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'class9',
  timestamps: false,
});

module.exports = Class9;