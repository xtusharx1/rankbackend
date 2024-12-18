// models/batch.js

module.exports = (sequelize, DataTypes) => {
    const Batch = sequelize.define('Batch', {
      batch_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      batch_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'Batches',
      timestamps: false
    });
  
    Batch.associate = (models) => {
      // Many-to-many relationship with Users (Students) through StudentBatches table
      Batch.belongsToMany(models.User, {
        through: 'StudentBatches',
        foreignKey: 'batch_id',
        otherKey: 'student_id',
        as: 'students'
      });
    };
  
    return Batch;
  };
  