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
const gamesMap = require('./common/gamesMap');
const socketsMap = require('./common/socketsMap');
const usersStateMap = require('./common/usersStateMap');
const doAction = require('./helpers/doAction');
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
  user.createTab({tabid: socket.handshake.query.tabId});

  console.log("correct connection");
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
        history: dataTable
      })
      await newHistory.save();

      let activeGamesList = await Games.findAll();

      let socketsList = Object.values(socketsMap);
      console.log(socketsList);
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


    if (data.isViewer) {
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

    socket.emit('game/new', {dataTable: [], gameId: data.gameId});

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

    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
    })


    viewers.forEach(item => {
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[data.gameId], gameOwner})
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
    })

  })

  socket.on('game/showHistory', async (data, callback) => {

    let gameId = await Games.findOne({
      include: [{
        model: Tabs,
        required: true,
        where: {
          tabid: socket.handshake.query.tabId
        }
      }],
    })

    let actionTime = await History.findOne({
      where: {
        history: data.action
      }
    })

    let history = await History.findAll({
      where: {
        gameid: gameId.gameid,
        createdat: {
          [Op.lte]: actionTime.createdat
        }
      }
    })
    console.log(data.action);
  })

  socket.on('game/surrender', async (data, callback) => {

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

    await game.save();

    if (arr.length > 1) {
      await changeMove(gameId.gameid);
    }

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

    viewers.forEach(item => {
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
    })

    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
    })
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

    let tabMove = await Moves.findOne({
      where: {
        gameid: gameId.gameid
      }
    })

    if (tabMove.tabid !== socket.handshake.query.tabId) {
      return;
    }

    let newAction = History.build({
      gameid: gameId.gameid,
      type: 'action',
      history: data
    })

    await newAction.save();

    let isMine = doAction(data, gameId.gameid);

    let listUsersInGame = await Tabs.findAll({
      where: {
        gameid: gameId.gameid
      }
    })

    let gameOwner = await Users.findOne({
      where: {
        userid: game.owner
      }
    })

    //click on Mine

    if (isMine) {
      delete usersStateMap[gameId.gameid][socket.handshake.query.tabId]
      game.createViewer({tabid: socket.handshake.query.tabId})
      socket.emit("game/surrendered", {surrendered: true});
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
      await changeMove(gameId.gameid);
    }

    if (isMine) {
      delete usersStateMap[gameId.gameid][socket.handshake.query.tabId]
    }

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

    let history = await History.findAll({
      where: {
        type: 'action',
        gameid: gameId.gameid
      }
    })


    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      socketsMap[item.tabid].emit('game/action', {dataTable: gamesMap[gameId.gameid], isMine})
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
      socketsMap[item.tabid].emit('game/listLogs', {history})
    })

    viewers.forEach(item => {
      socketsMap[item.tabid].emit('game/listViewers', {listViewers: usersTabs})
      socketsMap[item.tabid].emit('game/action', {dataTable: gamesMap[gameId.gameid], isMine})
      socketsMap[item.tabid].emit('game/listReadiness', {listReadiness: usersStateMap[gameId.gameid], gameOwner})
      socketsMap[item.tabid].emit('game/listLogs', {history})
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
