const {Sequelize, DataTypes} = require('sequelize');
const db = require('../config/database');
const Tabs = require('./Tabs');


const Users = db.define('users', {
    userid: {
      type: DataTypes.UUID,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
  },
  {
    timestamps: false,
    tableName: 'users',

  })

Users.hasMany(Tabs, {foreignKey: 'userid', onDelete: "cascade"});
// Users.hasMany(Tabs, {foreignKey: 'userid', onDelete: "cascade" });

//
// Users.hasMany(Tabs, {as: 'tabs'});
// Tabs.belongsTo(Users, {foreignKey: 'userid', as: 'users', onDelete: "cascade" })

Users.findUsersByUserName = function (username) {
  return this.findAll({where: {username}});
}

Users.findUserByUserId = function (userid) {
  return this.findOne({where: {userid}});
}

Users.buildNewUser = function (username, password) {
  return this.build({
    username,
    password
  });
}

Users.getUserByUserId = function (userid) {
  return this.findOne({
    where: {
      userid
    }
  });
}
Users.getUsersIncludeTabs = function (tabs) {
  return this.findAll({
    include: [{
      model: Tabs,
      where: {
        tabid: tabs
      }
    }]
  })
}


module.exports = Users;
