const {Sequelize, DataTypes} = require('sequelize');
const db = require('../config/database');
const Tabs = require('../models/Tabs');


const Moves = db.define('moves', {
    gameid: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    userid: {
      type: DataTypes.UUID,
      allowNull: false
    },
  },
  {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    timestamps: true,
    tableName: 'moves',
  })

// Games.hasMany(Tabs, {foreignKey: 'gameid', onDelete: "cascade"});
// Rooms.getRoomIncludeTabs = (tabid) => {
//   return this.findOne({
//     include: [{
//       model: Tabs,
//       required: true,
//       where: {
//         tabid
//       }
//     }]
//   })
// }
//
// Rooms.buildNewRoom = (roomid, roomname) => {
//   return this.build({
//     roomid,
//     roomname
//   })
// }
//
// Rooms.getRoomById = (roomid) => {
//   return this.findOne({
//     where: {
//       roomid
//     }
//   })
// }
//
// Rooms.getRoomByIdIncludeTabs = (roomid) => {
//   return this.findOne({
//     where: {
//       roomid
//     },
//     include: [{
//       model: Tabs,
//       required: true
//     }]
//   });
// }
//
// Rooms.hasMany(Tabs, {foreignKey: 'roomid', onDelete: "cascade" });

module.exports = Moves;
