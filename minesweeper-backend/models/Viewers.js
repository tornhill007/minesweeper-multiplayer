const {Sequelize, DataTypes} = require('sequelize');
const db = require('../config/database');
const Rooms = require('../models/Rooms');

const Viewers = db.define('viewers', {
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
    gameid: {
      type: DataTypes.STRING,
    }
  },
  {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    timestamps: true,
    tableName: 'viewers',
  })

// Tabs.getTabById = function (tabid) {
//   return this.findOne({
//     where: {
//       tabid
//     }
//   });
// }

module.exports = Viewers;
