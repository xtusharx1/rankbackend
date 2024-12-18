// models/studentDocuments.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Assuming your DB config is in this file

const StudentDocuments = sequelize.define('StudentDocuments', {
  document_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id',
    },
  },
  birth_certificate_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  student_aadhar_card_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  father_aadhar_card_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mother_aadhar_card_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  srn_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pen_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  school_transfer_certificate_url: {
    type: DataTypes.STRING,
    allowNull: true,
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
  tableName: 'StudentDocuments',
  timestamps: false,
});

module.exports = StudentDocuments;
