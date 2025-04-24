const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const studentType = sequelize.define('StudentType', {
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        // No foreign key reference
    },
    type: {
        type: DataTypes.ENUM('online', 'dayboarder', 'hosteller'),
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
    tableName: 'student_type',
    timestamps: false, // Manually handling created_at and updated_at
});

module.exports = studentType;
