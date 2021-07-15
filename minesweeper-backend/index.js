const express = require('express');
const app = express();
const cors = require("cors");
const httpServer = require("http").createServer(app);
const passport = require("passport");
const sequelize = require('./config/database');
const auth = require('./routes/auth');
const Users = require('./models/Users');
const Games = require('./models/Games');
const History = require('./models/History');
const Tabs = require('./models/Tabs');
const usersRoute = require('./routes/users');
const jwt = require("jsonwebtoken");
const keys = require('./config/keys');
const createGame = require('./helpers/createGame');
const generateUID = require('./helpers/generateUID');
const gamesMap = require('./common/gamesMap');
const socketsMap = require('./common/socketsMap');
const doAction = require('./helpers/doAction');

//Test DB
app.use(cors());
app.use(express.json());

sequelize.authenticate().then(() => {
  console.log("Database connected...")
}).catch((err) => {
  console.log("Error:" + err);
})

app.use(auth);
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
      socket.emit('game/new', {dataTable, gameId});
      let newGame = Games.build({
        maxplayers: data.gameInfo.maxPlayers,
        fieldsize: data.gameInfo.fieldSize,
        amountofmines: data.gameInfo.minesAmount,
        gameid: gameId,
        gamename: data.gameInfo.gameName
      })

      // let tableJson = JSON.stringify(dataTable);
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
      socketsList.forEach(item => {
        item.emit('game/list', activeGamesList);
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
    game.createTab({tabid: socket.handshake.query.tabId});
    socket.emit('game/new', {dataTable, gameId: data.gameId});
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
    // let activeGamesList = await Games.findOne({
    //   include: [{
    //     model: Tabs,
    //     required: true,
    //     where: {
    //       gameid: gameId
    //     }
    //   }]
    // })
    // let activeGamesList = await Games.findAll();

    // let socketsList = Object.values(socketsMap);
    listUsersInGame.forEach(item => {
      socketsMap[item.tabid].emit('game/action', {dataTable: gamesMap[gameId.gameid], isMine})
    })

    // socket.emit('game/action', {dataTable: gamesMap[gameId.gameid], isMine});
  })
});

httpServer.listen(8080, () => {
  console.log("Server has started on 8080 port")
});
