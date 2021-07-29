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
  let userid;
  arr.forEach((item, index) => {
    gameState[item].position = index;
    gameState[item].movePosition = game.moveposition == index;
    if (game.moveposition == index) {
      userid = gameState[item].userid;
    }
  })
  let newMove = Moves.build({
    gameid: gameId,
    userid: userid
  })
  await newMove.save();


  console.log(1);
}

module.exports = setPosition;