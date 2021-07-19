const {Sequelize, DataTypes} = require('sequelize');
const db = require('../config/database');
const Tabs = require('../models/Tabs');

// CREATE TABLE games(
//   id serial NOT NULL PRIMARY KEY,
//   gameName VARCHAR(255) NOT NULL,
//   maxPlayers NUMERIC NOT NULL,
//   gameId VARCHAR(255) NOT NULL,
//   amountOfMines NUMERIC NOT NULL,
//   fieldSize VARCHAR(255) NOT NULL,
//   createdAt timestamp NOT NULL,
//   updatedat timestamp NOT NULL
// );


const Games = db.define('games', {
    gameid: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    fieldsize: {
      type: DataTypes.STRING,
      allowNull: false
    },
    maxplayers: {
      type: DataTypes.UUID,
      allowNull: false
    },
    moveposition: {
      type: DataTypes.UUID,
      defaultValue: 0,
      allowNull: false
    },
    isplaying: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    amountofmines: {
      type: DataTypes.UUID,
      allowNull: false
    },
    gamename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    owner: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    timestamps: true,
    tableName: 'games',
  })

Games.hasMany(Tabs, {foreignKey: 'gameid', onDelete: "cascade"});
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

module.exports = Games;
