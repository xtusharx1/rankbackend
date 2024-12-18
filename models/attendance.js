const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 
const User = require('./User');  

const Attendance = sequelize.define('Attendance', {
  attendance_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  attendance_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent'),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'Attendance',
  timestamps: false,
});

// Define the relationship between Attendance and User (Student)
Attendance.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

module.exports = Attendance;
