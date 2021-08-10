const gamesMap = require('../common/gamesMap');

const doActionForLogs = ({i, j}, game, userId) => {
  // let gameTmp = JSON.parse(JSON.stringify(game));
  if(!i || !j) {
    return false;
  }
  let arr = [];
  let table = JSON.parse(JSON.stringify(game));
  if (table[i][j].isMine) {
    table[i][j].isOpen = true;
    table[i][j].isBlownUp = true;
    table[i][j].userId = userId;
    game = table;
    return game;
  }
  if (table[i][j].amountOfMines !== 0) {
    table[i][j].isOpen = true;
    game = table;
    table[i][j].userId = userId;
    return game;
  }
  arr.push(table[i][j])
  console.time('qqq')
  while (arr.length > 0) {

    let element = arr.shift();

    table[element.i][element.j].isOpen = true;
    if (!table[element.i][element.j].userId) {
      table[element.i][element.j].userId = userId;
    }

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (table[element.i - 1 + i] && table[element.i - 1 + i][element.j - 1 + j]) {
          if (table[element.i - 1 + i][element.j - 1 + j].amountOfMines === 0 && table[element.i - 1 + i][element.j - 1 + j].isOpen === false) {
            arr.push(table[element.i - 1 + i][element.j - 1 + j])
          }
          table[element.i - 1 + i][element.j - 1 + j].isOpen = true;
          if (!table[element.i - 1 + i][element.j - 1 + j].userId) {
            table[element.i - 1 + i][element.j - 1 + j].userId = userId;
          }
        }
      }
    }
  }
  console.timeEnd('qqq')
  game = table;
  return game;
}

module.exports = doActionForLogs;