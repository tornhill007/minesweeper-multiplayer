const usersStateMap = require('../common/usersStateMap');
const Games = require('../models/Games');
const Moves = require('../models/Moves');

const setPosition = async (gameId) => {

  let game = await Games.findOne({
    where: {
      gameid: gameId
    }
  })

  let gameState = usersStateMap[gameId];
  let arr = Object.keys(gameState);
  let tabid;
  arr.forEach((item, index) => {
    gameState[item].position = index;
    gameState[item].movePosition = game.moveposition == index;
    if (game.moveposition == index) {
      tabid = item;
    }
  })
  let newMove = Moves.build({
    gameid: gameId,
    tabid: tabid
  })
  await newMove.save();


  console.log(1);
}

module.exports = setPosition;