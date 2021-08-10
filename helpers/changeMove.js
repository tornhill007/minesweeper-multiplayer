const usersStateMap = require('../common/usersStateMap');
const Games = require('../models/Games');
const Moves = require('../models/Moves');

const changeMove = async (gameId, userId) => {

  let game = await Games.findOne({
    where: {
      gameid: gameId
    }
  })
  let userid;
  let gameState = usersStateMap[gameId];
  let arr = Object.keys(gameState);
  arr.forEach((item, index) => {
    gameState[item].movePosition = game.moveposition == gameState[item].position;
    if(game.moveposition == gameState[item].position) {
      userid = gameState[item].userid;
    }
  })

  let newMove = await Moves.findOne({
    where: {
      gameid: gameId
    }
  })
  if(!newMove) {
    newMove = Moves.build({
      gameid: gameId,
      userid: userid
    })
    await newMove.save();
    return;
  }
  newMove.userid = userid;
  await newMove.save();
}

module.exports = changeMove;