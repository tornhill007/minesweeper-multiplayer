const express = require('express')
const app = express();
const cors = require("cors");
const httpServer = require("http").createServer(app);
const passport = require("passport");
const sequelize = require('./config/database')
const auth = require('./routes/auth');
const usersRoute = require('./routes/users');
const history = require('./routes/history');


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
console.log("correct connection")
});

httpServer.listen(8080, () => {
  console.log("Server has started on 8080 port")
});
