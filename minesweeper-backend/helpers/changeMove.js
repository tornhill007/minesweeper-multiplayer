const usersStateMap = require('../common/usersStateMap');
const Games = require('../models/Games');
const Moves = require('../models/Moves');

const changeMove = async (gameId) => {

  let game = await Games.findOne({
    where: {
      gameid: gameId
    }
  })
  let tabid;
  let gameState = usersStateMap[gameId];
  let arr = Object.keys(gameState);
  arr.forEach((item, index) => {
    gameState[item].movePosition = game.moveposition == gameState[item].position;
    if(game.moveposition == gameState[item].position) {
      tabid = item;
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
      tabid: tabid
    })
    await newMove.save();
    return;
  }
  newMove.tabid = tabid;
  await newMove.save();
}

module.exports = changeMove;