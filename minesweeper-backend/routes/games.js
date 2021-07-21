const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const Games = require('../models/Games');
const passport = require('passport')
const jwt = require("jsonwebtoken");
const keys = require('../config/keys');
//################registration
const catchWrap = require("../common/wrapper");

router.use('/game/:gameId', passport.authenticate('jwt', {session: false}), async (req, res, next) => {

  let decoded = jwt.verify(req.headers.authorization.split(' ')[1], keys.jwt);
  console.log(decoded)
  next()
})

router.get("/game/:gameId", catchWrap(async (req, res) => {
  // const {password, userName} = req.body;
  const gameId = req.params.gameId;

  const game = await Games.findOne({
    where: {
      gameid: gameId
    }
  })
  res.json(game);
}))

module.exports = router;