const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StudentDocuments = sequelize.define('StudentDocuments', {
  document_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  birth_certificate: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'File path for birth certificate'
  },
  student_adhaar_card: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'File path for student adhaar card'
  },
  father_adhaar_card: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'File path for father adhaar card'
  },
  mother_adhaar_card: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'File path for mother adhaar card'
  },
  previous_school_marksheet: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'File path for previous school marksheet'
  },
  school_leaving_certificate: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'File path for school leaving certificate'
  },
  srn_number: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'SRN number'
  },
  pen_number: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'PEN number'
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