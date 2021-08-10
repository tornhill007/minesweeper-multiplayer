const {Sequelize, DataTypes} = require('sequelize');
const db = require('../config/database');

const History = db.define('history', {
    id: {
      type: DataTypes.UUID,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    gameid: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userid: {
      type: DataTypes.UUID,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amountofmines: {
      type: DataTypes.UUID,
    },
    history: {
      type: DataTypes.JSON,
      allowNull: false
    },
  },
  {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    timestamps: true,
    tableName: 'history',
  })

// History.buildNewRecord = function (roomid, userid, history) {
//   return this.build({
//     roomid,
//     userid,
//     history
//   });
// }

// History.getHistoryByRoomId = function (roomid) {
//   return this.findOne({
//     where: {
//       roomid
//     }
//   })
// }
//
// History.buildNewHistory = (roomid, history) => {
//   return this.build({
//     roomid,
//     history
//   })
// }

module.exports = History;
