'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('OtherChargesRecords', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      feeStatus_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'FeeStatus',
          key: 'id'
        },
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('OtherChargesRecords');
  }
};
