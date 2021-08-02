const gamesMap = require('../common/gamesMap');
const socketsMap = require('../common/socketsMap');
const usersStateMap = require('../common/usersStateMap');
const Users = require('../models/Users');
const Games = require('../models/Games');
const History = require('../models/History');
const Viewers = require('../models/Viewers');
const Moves = require('../models/Moves');
const Tabs = require('../models/Tabs');
const UserInfo = require('../models/UserInfo');
const changeMove = require('../helpers/changeMove');

const surrender = async (socket) => {
  socket.emit("game/surrendered", {surrendered: true});

  let gameId = await Games.findOne({
    include: [{
      model: Tabs,
      required: true,
      where: {
        tabid: socket.handshake.query.tabId
      }
    }],
  })

  let game = await Games.findOne({
    where: {
      gameid: gameId.gameid
    }
  })

  let gameOwner = await Users.findOne({
    where: {
      userid: game.owner
    }
  })
  delete usersStateMap[gameId.gameid][socket.handshake.query.tabId]
  game.createViewer({
    tabid: socket.handshake.query.tabId
  })
  let arr = Object.keys(usersStateMap[gameId.gameid])
  for (let i = 0; i < arr.length; i++) {
    usersStateMap[gameId.gameid][arr[i]].position = i;
  }
  game.moveposition = +game.moveposition - 1;
  let userInfo = await UserInfo.findOne({
    where: {
      userid: socket.user.userid
    }
  })
  if (userInfo) {
    userInfo.lossamount = +userInfo.lossamount + 1;
  } else {
    userInfo = UserInfo.build({
      userid: +socket.user.userid,
      lossamount: 1,
      winamount: 0
    })
  }
  await userInfo.save();
  socket.emit("game/blownUp", {blownUp: true})

  if (arr.length === 1) {

    let user = await Users.findOne({
      include: [{
        model: Tabs,
        required: true,
        where: {
          tabid: arr[0]
        }
      }]
    })

    let win = await UserInfo.findOne({
      where: {
        userid: user.userid
      }
    })
    if (win) {
      win.winamount = +win.winamount + 1;
    } else {
      win = UserInfo.build({
        userid: user.userid,
        winamount: 1,
        lossamount: 0
      })
    }
    game.createViewer({
      tabid: arr[0]
    })
    delete usersStateMap[gameId.gameid][arr[0]]
    await win.save();
    socketsMap[arr[0]].emit("game/surrendered", {surrendered: true});

    game.isfinished = true;
    game.isplaying = false;

    socketsMap[arr[0]].emit("game/win", {win: true})
  }

  let listUsersInGame = await Tabs.findAll({
    where: {
      gameid: gameId.gameid
    }
  })

  // let arr1 = Object.keys(usersStateMap[gameId.gameid]);
  if (arr.length <= +game.moveposition + 1) {
    game.moveposition = 0;
  } else {
    game.moveposition = +game.moveposition + 1;
  }
  let tab = await Tabs.destroy({
    where: {
      gameid: gameId.gameid,
      tabid: socket.handshake.query.tabId
    }
  })
  await game.save();

  if (arr.length > 1) {
    await changeMove(gameId.gameid);
  }

  let viewers = await Viewers.findAll({
    where: {
      islive: true,
      gameid: game.gameid
    }
  })

  let tabs = viewers.map(item => {
    return item.tabid
  })

  let usersTabs = await Users.findAll({
    include: [{
      model: Tabs,
      required: true,
      where: {
        tabid: tabs
      }
    }]
  })

  let activeGamesList = await Games.findAll({
    where: {
      isplaying: true
    }
  });

  // if (arr.length === 1) {
  //   await game.destroy();
  // }

  // let activeGamesList = await Games.findAll();

  let socketsList = Object.values(socketsMap);


  let usersInfo = await UserInfo.findAll({
  })


  socketsList.forEach(item => {
    item.emit('game/list', activeGamesList);
    item.emit('game/playerStats', {playerStats: usersInfo})
  })




  viewers.forEach(item => {
    socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
    // socketsMap[item.tabid].emit('game/list', activeGamesList);

    socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
  })

  listUsersInGame.forEach(item => {
    socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})

    // socketsMap[item.tabid].emit('game/list', activeGamesList);
    socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
  })
}

module.exports = surrender;