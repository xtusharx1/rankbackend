const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vacancy = sequelize.define('Vacancy', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  school_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  class_level: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vacancies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true, // or false if you want it required
  },
}, {
  tableName: 'sainik_school_vacancies',
  timestamps: false,
});

module.exports = Vacancy;
