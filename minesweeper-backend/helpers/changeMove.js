const usersStateMap = require('../common/usersStateMap');
const Games = require('../models/Games');

const changeMove = async (gameId) => {

  let game = await Games.findOne({
    where: {
      gameid: gameId
    }
  })

  let gameState = usersStateMap[gameId];
  let arr = Object.keys(gameState);
  arr.forEach((item, index) => {
    gameState[item].movePosition = game.moveposition == index;
  })
}

module.exports = changeMove;