const {Sequelize, DataTypes} = require('sequelize');
const db = require('../config/database');
const Rooms = require('./Rooms');

const Tabs = db.define('tabs', {
    id: {
      type: DataTypes.UUID,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    tabid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userid: {
      type: DataTypes.UUID,
    },
    gameid: {
      type: DataTypes.STRING,
    }
  },
  {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    timestamps: true,
    tableName: 'tabs',
  })

// Tabs.getTabById = function (tabid) {
//   return this.findOne({
//     where: {
//       tabid
//     }
//   });
// }

module.exports = Tabs;
