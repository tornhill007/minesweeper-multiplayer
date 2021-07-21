const {Sequelize, DataTypes} = require('sequelize');
const db = require('../config/database');
const Tabs = require('../models/Tabs');


const UserInfo = db.define('userinfo', {
    userid: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    winamount: {
      type: DataTypes.UUID,
      allowNull: false
    },
    lossamount: {
      type: DataTypes.UUID,
      allowNull: false
    },
  },
  {
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    timestamps: true,
    tableName: 'userinfo',
  })

// Games.hasMany(Tabs, {foreignKey: 'gameid', onDelete: "cascade"});
// Rooms.hasMany(Tabs, {foreignKey: 'roomid', onDelete: "cascade" });

module.exports = UserInfo;
