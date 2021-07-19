const usersStateMap = require('../common/usersStateMap');
const Games = require('../models/Games');

const setPosition = async (gameId) => {

  let game = await Games.findOne({
    where: {
      gameid: gameId
    }
  })

  let gameState = usersStateMap[gameId];
  let arr = Object.keys(gameState);
  arr.forEach((item, index) => {
    gameState[item].position = index;
    gameState[item].movePosition = game.moveposition == index;
  })
  console.log(1);
}

module.exports = setPosition;