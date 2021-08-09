const Users = require('../models/Users');
const Games = require('../models/Games');
const History = require('../models/History');
const Viewers = require('../models/Viewers');
const Tabs = require('../models/Tabs');
const socketsMap = require('../common/socketsMap');
const usersStateMap = require('../common/usersStateMap');
const surrender = require('./surrender');

module.exports = async (socket) => {
  let viewer = await Viewers.findOne({
    where: {
      tabid: socket.handshake.query.tabId
    }
  })

  let gameid;

  let gameId = await Games.findOne({
    include: [{
      model: Tabs,
      required: true,
      where: {
        tabid: socket.handshake.query.tabId
      }
    }],
  })

  if (!gameId) {
    let gameIdViewer = await Games.findOne({
      include: [{
        model: Viewers,
        required: true,
        where: {
          tabid: socket.handshake.query.tabId
        }
      }],
    })

    gameid = gameIdViewer.gameid
  } else {
    gameid = gameId.gameid;
  }

  let game = await Games.findOne({
    where: {
      gameid: gameid
    }
  })

  let tabsGames = await Tabs.findAll({
    where: {
      gameid: gameid
    }
  })

  let tabsArr = tabsGames.map(item => item.tabid);

  let userGames = await Users.findOne({
    include: [{
      model: Tabs,
      required: true,
      where: {
        userid: socket.user.userid,
        tabid: tabsArr
      }
    }]
  })

  if (!viewer) {
    if (!game.isplaying) {
      if (game.owner == socket.user.userid && userGames && userGames.tabs.length <= 1) {
        await game.destroy();

        tabsArr.forEach(item => {
          socketsMap[item].emit('game/delete/byOwner', {gameDeletedByOwner: true})
        })
      }
    }
    if (game.isplaying && userGames.tabs.length <= 1) {
      await surrender(socket);
    }
  }

  // let deletedViewer = await Viewers.destroy({
  //   where: {
  //     tabid: socket.handshake.query.tabId
  //   }
  // })


  let viewerNew = await Viewers.findOne({
    where: {
      tabid: socket.handshake.query.tabId
    }
  })

  let gameOwner = await Users.findOne({
    where: {
      userid: game.owner
    }
  })

  if (usersStateMap[gameid] [socket.handshake.query.tabId]) {
    usersStateMap[gameid][socket.handshake.query.tabId].isReady = false;
  }


  let socketsList = Object.values(socketsMap);

  if (userGames && userGames.tabs.length > 1) {
    let tabDeleted = await Tabs.destroy({
      where: {
        gameid: gameid,
        tabid: socket.handshake.query.tabId
      }
    })
  } else {
    if (viewerNew) {
      await viewerNew.destroy();
      socket.emit("game/surrendered", {surrendered: false});
      let tab = await Tabs.destroy({
        where: {
          gameid: gameid,
          tabid: socket.handshake.query.tabId
        }
      })


      // let destroyedViewer = await Viewers.destroy({
      //   where: {
      //     tabid: socket.handshake.query.tabId,
      //     gameid: gameid
      //   }
      // })
    } else {

      // delete usersStateMap[gameid][socket.handshake.query.tabId]
    }

    let listUsersInGame = await Tabs.findAll({
      where: {
        gameid: gameid
      }
    })
    if (listUsersInGame.length > 0) {

      let listTabsInGame = listUsersInGame.map(tab => tab.tabid)

      let users = await Users.findAll({
        include: [{
          model: Tabs,
          required: true,
          where: {
            tabid: listTabsInGame
          }
        }]
      })

      socketsList.forEach(item => {
        item.emit('game/users', {usersUniq: users, gameid: gameid});
      })
    } else {
      await game.destroy();
    }
  }


  let viewers = await Viewers.findAll({
    where: {
      gameid: gameid
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

  let deletedTab = await Tabs.destroy({
    where: {
      gameid: gameid,
      tabid: socket.handshake.query.tabId
    }
  })

  let restUsersInGame = await Tabs.findAll({
    where: {
      gameid: gameid
    }
  })

  let restListTabsInGame = restUsersInGame.map(tab => tab.tabid)

  let restUsers = await Users.findAll({
    include: [{
      model: Tabs,
      required: true,
      where: {
        tabid: restListTabsInGame
      }
    }]
  })


  if (restUsers.length === 1) {
    delete usersStateMap[gameid][socket.handshake.query.tabId]
  }

  if (userGames && userGames.tabs.length <= 1) {
    for (let key in usersStateMap[gameid]) {
      if (usersStateMap[gameid][key].userid == socket.user.userid) {
        delete usersStateMap[gameid][key]
      }
    }
  }


  let usersInGame = await Games.findAll({
    include: [{
      model: Tabs,
      required: true,
      where: {
        gameid: gameid
      }
    }]
  })

  if (usersInGame.length === 0) {
    await game.destroy();
    let historyDestroyed = await History.destroy({
      where: {
        gameid: gameid
      }
    })
  }

  let activeGamesList = await Games.findAll();

  let listUsersInGame = await Tabs.findAll({
    where: {
      gameid: gameid
    }
  })

  let viewerDestroyed = await Viewers.destroy({
    where: {
      gameid: gameid,
      tabid: socket.handshake.query.tabId
    }
  })

  let listTabsInGame = listUsersInGame.map(tab => tab.tabid)

  let users = await Users.findAll({
    include: [{
      model: Tabs,
      required: true,
      where: {
        tabid: listTabsInGame
      }
    }]
  })


  socketsList.forEach(item => {
    item.emit('game/list', activeGamesList);
    item.emit('game/users', {usersUniq: users, gameid: gameid});
  })


  listUsersInGame.forEach(item => {
    socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameid], gameOwner})
    // socketsMap[item.tabid].emit('game/list', activeGamesList);
    // socketsMap[item.tabid].emit('game/users', listUsersInGame);
    socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
  })

  viewers.forEach(item => {
    socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameid], gameOwner})
    // socketsMap[item.tabid].emit('game/list', activeGamesList);
    // socketsMap[item.tabid].emit('game/users', listUsersInGame);
    socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
  })

}