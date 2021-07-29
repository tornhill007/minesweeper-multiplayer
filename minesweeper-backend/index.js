const express = require('express');
const app = express();
const cors = require("cors");
const httpServer = require("http").createServer(app);
const passport = require("passport");
const sequelize = require('./config/database');
const auth = require('./routes/auth');
const games = require('./routes/games');
const Users = require('./models/Users');
const Games = require('./models/Games');
const History = require('./models/History');
const Viewers = require('./models/Viewers');
const Moves = require('./models/Moves');
const Tabs = require('./models/Tabs');
const UserInfo = require('./models/UserInfo');
const usersRoute = require('./routes/users');
const jwt = require("jsonwebtoken");
const keys = require('./config/keys');
const createGame = require('./helpers/createGame');
const generateUID = require('./helpers/generateUID');
const setPosition = require('./helpers/setPosition');
const changeMove = require('./helpers/changeMove');
const surrender = require('./helpers/surrender');
const gamesMap = require('./common/gamesMap');
const socketsMap = require('./common/socketsMap');
const usersStateMap = require('./common/usersStateMap');
const doAction = require('./helpers/doAction');
const doActionForLogs = require('./helpers/doActionForLogs');
const {Sequelize} = require('sequelize');
const Op = Sequelize.Op;

//Test DB
app.use(cors());
app.use(express.json());

sequelize.authenticate().then(() => {
  console.log("Database connected...")
}).catch((err) => {
  console.log("Error:" + err);
})

app.use(auth);
app.use(games);
app.use(usersRoute);
// app.use(history);

app.use(passport.initialize());
require('./middleware/passport')(passport);

const io = require("socket.io")(httpServer, {
  cors: {
    origin: '*',
  }
});

io.on("connection", async (socket) => {
  let decoded = null
  try {
    decoded = jwt.verify(socket.handshake.query.loggeduser.split(' ')[1], keys.jwt);
  } catch (e) {
    console.log('Invalid token', e)
  }
  if (!decoded) return;
  let user = await Users.getUserByUserId(decoded.userId);
  if (!user) return;
  socket.user = user;

  socketsMap[socket.handshake.query.tabId] = socket;

  let userTab = await Users.findOne({
    include: [{
      model: Tabs,
      required: true,
      where: {
        tabid: socket.handshake.query.tabId
      }
    }]
  })

  if (!userTab) {
    user.createTab({tabid: socket.handshake.query.tabId});
  }

  let tabInGame = await Games.findOne({
    include: [{
      model: Tabs,
      required: true,
      where: {
        tabid: socket.handshake.query.tabId
      }
    }]
  })

  if (tabInGame) {

    let game = await Games.findOne({
      where: {
        gameid: tabInGame.gameid
      }
    })
    let viewers = await Viewers.findAll({
      where: {
        gameid: tabInGame.gameid
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
    let listUsersInGame = await Tabs.findAll({
      where: {
        gameid: tabInGame.gameid
      }
    })

    let history = await History.findAll({
      where: {
        type: 'action',
        gameid: tabInGame.gameid
      }
    })


    let socketsList = Object.values(socketsMap);

    let gameOwner = await Users.findOne({
      where: {
        userid: game.owner
      }
    })


    socketsList.forEach(item => {
      // item.emit('game/list', activeGamesList);
      // if(usersStateMap[tabInGame.gameid].length > 0) {
      //   // item.emit('game/listReadiness', {listReadiness: usersStateMap[tabInGame.gameid], gameOwner})
      // }
    })

    socket.emit("game/refresh", {gameId: tabInGame.gameid})
    socket.emit('game/new', {dataTable: gamesMap[tabInGame.gameid], gameId: tabInGame.gameid})
    socket.emit('game/users', listUsersInGame);
    socket.emit('game/listLogs', {history})
    socket.emit('game/listViewers', {listViewers: usersTabs})
    socket.emit('game/info', {game})
    // socket.emit('game/list', activeGamesList);
    if (usersStateMap[tabInGame.gameid]) {
      socket.emit('game/listReadiness', {listReadiness: usersStateMap[tabInGame.gameid]})
    }

  }
  let activeGamesList = await Games.findAll();
  socket.emit('game/list', activeGamesList);

  console.log("correct connection");

  socket.on('game/getPlayerStats', async (data, callback) => {

    let userInfo = await UserInfo.findAll()

    socket.emit('game/playerStats', {playerStats: userInfo})
  })

  socket.on('game/create', async (data, callback) => {
      if (!data) {
        return callback('Incorrect data');
      }
      let dataTable = createGame(data.gameInfo);
      let gameId = generateUID();
      gamesMap[gameId] = dataTable;
      socket.emit('game/new', {dataTable: [], gameId});
      let newGame = Games.build({
        maxplayers: data.gameInfo.maxPlayers,
        fieldsize: data.gameInfo.fieldSize,
        amountofmines: data.gameInfo.minesAmount,
        gameid: gameId,
        gamename: data.gameInfo.gameName,
        owner: socket.user.userid
      })

      await newGame.save();

      newGame.createTab({tabid: socket.handshake.query.tabId});
      let newHistory = History.build({
        gameid: gameId,
        type: 'state',
        history: dataTable,
        username: user.username,
        userid: user.userid,
      })
      await newHistory.save();

      let activeGamesList = await Games.findAll();

      let socketsList = Object.values(socketsMap);

      let listUsersInGame = await Tabs.findAll({
        where: {
          gameid: gameId
        }
      })

      let gameOwner = await Users.findOne({
        where: {
          userid: newGame.owner
        }
      })

      usersStateMap[gameId] = {
        [socket.handshake.query.tabId]: {
          isReady: true,
          username: socket.user.username,
          userid: socket.user.userid
        }
      };

      socketsList.forEach(item => {
        item.emit('game/list', activeGamesList);
        item.emit('game/users', listUsersInGame);
        item.emit('game/listReadiness', {listReadiness: usersStateMap[gameId], gameOwner})
      })
    }
  )

  socket.on('game/return/live', async (data, callback) => {

  })

  socket.on("game/join", async (data, callback) => {

    let dataTable = gamesMap[data.gameId];
    let game = await Games.findOne({
      where: {
        gameid: data.gameId
      }
    })


    let gameOwner = await Users.findOne({
      where: {
        userid: game.owner
      }
    })

    // let user = await Games.findOne({
    //   include: [{
    //     model: Tabs,
    //     required: true,
    //     where: {
    //       tabid: socket.handshake.query.tabId
    //     }
    //   }]
    // })

    let tabsGames = await Tabs.findAll({
      where: {
        gameid: data.gameId
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

    if (userGames) {

      let listUsersInGame = await Tabs.findAll({
        where: {
          gameid: data.gameId
        }
      })

      let viewers = await Viewers.findAll({
        where: {
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
      if (game.isplaying) {
        game.createTab({tabid: socket.handshake.query.tabId});
        socket.emit('game/new', {dataTable: gamesMap[data.gameId], gameId: data.gameId})
        socket.emit('game/users', listUsersInGame);
        if (usersStateMap[data.gameId]) {
          socket.emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
        }
        socket.emit('game/listViewers', {listViewers: usersTabs})
        socket.emit('game/info', {game})
        return;
      } else {

        game.createTab({tabid: socket.handshake.query.tabId});

        socket.emit('game/new', {dataTable: [], gameId: data.gameId})
        socket.emit('game/users', listUsersInGame);
        if (usersStateMap[data.gameId]) {
          socket.emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
        }

        socket.emit('game/listViewers', {listViewers: usersTabs})
        socket.emit('game/info', {game})
        return;
      }

    }


    if (data.isViewer || (!data.isViewer && game.isplaying)) {
      await game.createViewer({tabid: socket.handshake.query.tabId});
      socket.emit("game/surrendered", {surrendered: true});
    } else {
      await game.createTab({tabid: socket.handshake.query.tabId});

      if (!usersStateMap[data.gameId]) {
        usersStateMap[data.gameId] = {
          [socket.handshake.query.tabId]: {
            isReady: false,
            username: socket.user.username,
            userid: socket.user.userid
          }
        };
      }
      usersStateMap[data.gameId][socket.handshake.query.tabId] = {
        isReady: false,
        username: socket.user.username,
        userid: socket.user.userid
      };

    }
    if (game.isplaying) {
      socket.emit('game/new', {dataTable: gamesMap[data.gameId], gameId: data.gameId})
    } else {
      socket.emit('game/new', {dataTable: [], gameId: data.gameId});
    }


    let socketsList = Object.values(socketsMap);
    let listUsersInGame = await Tabs.findAll({
      where: {
        gameid: data.gameId
      }
    })
    socketsList.forEach(item => {
      item.emit('game/users', listUsersInGame);
    })

    let viewers = await Viewers.findAll({
      where: {
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

    // let usersViewers = await Users.findAll({
    //     where: {
    //       userid: [usersid]
    //     }
    // })

    let history = await History.findAll({
      where: {
        type: 'action',
        gameid: game.gameid
      }
    })

    socket.emit('game/listLogs', {history})

    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      socketsMap[item.tabid].emit('game/info', {game})
    })


    viewers.forEach(item => {
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      socketsMap[item.tabid].emit('game/info', {game})
    })

  })

  socket.on('game/showHistory', async (data, callback) => {

    let gameId = await Games.findOne({
      include: [{
        model: Viewers,
        required: true,
        where: {
          tabid: socket.handshake.query.tabId
        }
      }],
    })

    let viewer = await Viewers.findOne({
      where: {
        tabid: socket.handshake.query.tabId,
        gameid: gameId.gameid
      }
    })

    if (!viewer) {
      return;
    }

    let actionTime = await History.findOne({
      where: {
        gameid: gameId.gameid,
        history: data.action
      }
    })

    let history = await History.findAll({
      where: {
        gameid: gameId.gameid,
        // createdat: {
        //   [Op.lte]: actionTime.createdat
        // }
      }
    })

    if (history[history.length - 1].history.i === data.action.i && history[history.length - 1].history.j === data.action.j) {
      viewer.islive = true;
      socket.emit('game/action', {dataTable: gamesMap[gameId.gameid]});
      await viewer.save();
      return;
    }

    viewer.islive = false;

    await viewer.save();


    let filteredHistory = history.filter(item => {
      return Date.parse(item.createdat) <= Date.parse(actionTime.createdat)
    })
    let i = 1;
    let state = filteredHistory.filter(item => {
      return item.type === 'state'
    })
    let table = JSON.parse(JSON.stringify(state[0].history));
    const showTableLogs = () => {
      if (i === filteredHistory.length) {
        return;
      }
      let newTable = doActionForLogs(filteredHistory[i].history, table, filteredHistory[i].userid);
      table = newTable;
      i += 1;
      showTableLogs();
    }

    showTableLogs();

    socket.emit('game/action', {dataTable: table});

    console.log('CREATED_AT', history[0].createdat);
  })

  socket.on('game/surrender', async (data, callback) => {

    surrender(socket);

  })

  socket.on('game/action', async (data, callback) => {
    if (!data) {
      return callback('Incorrect data');
    }

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

    if (!game.isplaying) {
      return;
    }

    let userMove = await Moves.findOne({
      where: {
        gameid: gameId.gameid
      }
    })

    if (userMove.userid != socket.user.userid) {
      return;
    }

    let newAction = History.build({
      gameid: gameId.gameid,
      type: 'action',
      history: data,
      username: user.username,
      userid: user.userid,
      amountofmines: +gamesMap[gameId.gameid][data.i][data.j].amountOfMines
    })

    await newAction.save();

    let isMine = doAction(data, gameId.gameid, socket.user.userid);


    let gameOwner = await Users.findOne({
      where: {
        userid: game.owner
      }
    })

    //click on Mine

    if (isMine) {

      delete usersStateMap[gameId.gameid][socket.handshake.query.tabId]



      let tabsGames = await Tabs.findAll({
        where: {
          userid: socket.user.userid
        }
      })

      let tabsGamesArr = tabsGames.map(item => item.tabid);

      let tabsInGame = await Tabs.findAll({
        where: {
          tabid: tabsGamesArr,
          gameid: gameId.gameid
        }
      })

      let tabsArr = tabsInGame.map(item => {
        return item.tabid
      })


      // let tabsGames = await Tabs.findAll({
      //   where: {
      //     gameid: gameId.gameid,
      //     userid: socket.user.userid
      //   }
      // })
      //
      // let tabsArr = tabsGames.map(item => item.tabid);



      tabsArr.forEach(item => {
        game.createViewer({tabid: item})
        socketsMap[item].emit("game/surrendered", {surrendered: true});
      })
      // socket.emit("game/surrendered", {surrendered: true});
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
      tabsArr.forEach(item => {
        socketsMap[item].emit("game/blownUp", {blownUp: true})
      })
      // socket.emit("game/blownUp", {blownUp: true})

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


        let tabsGames = await Tabs.findAll({
          where: {
            userid: socket.user.userid
          }
        })

        let tabsGamesArr = tabsGames.map(item => item.tabid);

        let tabsInGame = await Tabs.findAll({
          where: {
            tabid: tabsGamesArr,
            gameid: gameId.gameid
          }
        })

        let tabsArr = tabsInGame.map(item => {
          return item.tabid
        })

        //
        // let userGames = await Users.findOne({
        //   include: [{
        //     model: Tabs,
        //     required: true,
        //     where: {
        //       userid: socket.user.userid,
        //       tabid: tabsArr
        //     }
        //   }]
        // })





        tabsArr.forEach(item => {
          game.createViewer({
            tabid: arr[0]
          })
        })


        delete usersStateMap[gameId.gameid][arr[0]]
        socketsMap[arr[0]].emit("game/surrendered", {surrendered: true});
        await win.save();
        game.isplaying = false;
        socketsMap[arr[0]].emit("game/win", {win: true})
      }

      // let viewers = await Viewers.findAll({
      //   where: {
      //     gameid: game.gameid
      //   }
      // })

    }

    let arr = Object.keys(usersStateMap[gameId.gameid]);
    if (arr.length <= +game.moveposition + 1) {
      game.moveposition = 0;
    } else {
      game.moveposition = +game.moveposition + 1;
    }

    await game.save();

    if (arr.length > 1) {
      await changeMove(gameId.gameid, socket.user.userid);
    }

    if (isMine) {
      delete usersStateMap[gameId.gameid][socket.handshake.query.tabId]
    }

    let viewers = await Viewers.findAll({
      where: {
        islive: true,
        gameid: game.gameid
      }
    })

    let allViewers = await Viewers.findAll({
      where: {
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

    let history = await History.findAll({
      where: {
        type: 'action',
        gameid: gameId.gameid
      }
    })

    let listUsersInGame = await Tabs.findAll({
      where: {
        gameid: gameId.gameid
      }
    })

    let userInfo = await UserInfo.findAll()

    let socketsList = Object.values(socketsMap);

    socketsList.forEach(item => {
      item.emit('game/playerStats', {playerStats: userInfo})
    })


    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      // socketsMap[item.tabid].emit('game/playerStats', {playerStats: userInfo})
      socketsMap[item.tabid].emit('game/action', {dataTable: gamesMap[gameId.gameid], isMine})
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
      socketsMap[item.tabid].emit('game/listLogs', {history})
    })

    viewers.forEach(item => {
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      // socketsMap[item.tabid].emit('game/playerStats', {playerStats: userInfo})
      socketsMap[item.tabid].emit('game/action', {dataTable: gamesMap[gameId.gameid], isMine})
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
      socketsMap[item.tabid].emit('game/listLogs', {history})
    })

    allViewers.forEach(item => {
      socketsMap[item.tabid].emit('game/playerStats', {playerStats: userInfo})
      // socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      // socketsMap[item.tabid].emit('game/action', {dataTable: gamesMap[gameId.gameid], isMine})
      // socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
      socketsMap[item.tabid].emit('game/listLogs', {history})
    })

  })

  socket.on('game/exit', async (data, callback) => {


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
      if (game.isplaying && !userGames) {
        await surrender(socket);
      }
    }

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

    if (usersStateMap[gameid][socket.handshake.query.tabId]) {
      usersStateMap[gameid][socket.handshake.query.tabId].isReady = false;
    }



    let socketsList = Object.values(socketsMap);

    if (userGames) {
      let tabDeleted = await Tabs.destroy({
        where: {
          gameid: gameid,
          tabid: socket.handshake.query.tabId
        }
      })
    }
  else {
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

        delete usersStateMap[gameid][socket.handshake.query.tabId]
      }

      let listUsersInGame = await Tabs.findAll({
        where: {
          gameid: gameid
        }
      })
      if (listUsersInGame.length > 0) {
        socketsList.forEach(item => {
          item.emit('game/users', listUsersInGame);
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

    let usersInGame = await Games.findAll({
      include: [{
        model: Tabs,
        required: true,
        where: {
          gameid: gameid
        }
      }]
    })

    if(usersInGame.length === 0) {
      await game.destroy();
    }

    let activeGamesList = await Games.findAll();

    socketsList.forEach(item => {
      item.emit('game/list', activeGamesList);
    })
    let listUsersInGame = await Tabs.findAll({
      where: {
        gameid: gameid
      }
    })


    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameid], gameOwner})
      // socketsMap[item.tabid].emit('game/list', activeGamesList);
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
    })

    viewers.forEach(item => {
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameid], gameOwner})
      // socketsMap[item.tabid].emit('game/list', activeGamesList);
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
    })

  })

  socket.on('game/readiness', async (data, callback) => {
    usersStateMap[data.gameId][socket.handshake.query.tabId].isReady = data.isReady;

    let listUsersInGame = await Tabs.findAll({
      where: {
        gameid: data.gameId
      }
    })
    let game = await Games.findOne({
      where: {
        gameid: data.gameId
      }
    })
    let gameOwner = await Users.findOne({
      where: {
        userid: game.owner
      }
    })
    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
    })
    console.log(1);
  })

  socket.on('game/start', async (data, callback) => {
    let dataTable = gamesMap[data.gameId];
    let game = await Games.findOne({
      where: {
        gameid: data.gameId
      }
    })
    game.isplaying = true;
    await game.save();
    let listUsersInGame = await Tabs.findAll({
      where: {
        gameid: data.gameId
      }
    })

    let activeGamesList = await Games.findAll();
    let socketsList = Object.values(socketsMap);
    socketsList.forEach(item => {
      item.emit('game/list', activeGamesList);
    })

    let gameOwner = await Users.findOne({
      where: {
        userid: game.owner
      }
    })

    await setPosition(data.gameId);

    let viewers = await Viewers.findAll({
      where: {
        islive: true,
        gameid: game.gameid
      }
    })

    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/new', {dataTable, gameId: data.gameId});
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
      socketsMap[item.tabid].emit('game/info', {game})
    })

    viewers.forEach(item => {
      socketsMap[item.tabid].emit('game/new', {dataTable, gameId: data.gameId});
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
      socketsMap[item.tabid].emit('game/info', {game})
    })

  })
});

httpServer.listen(8080, () => {
  console.log("Server has started on 8080 port")
});
