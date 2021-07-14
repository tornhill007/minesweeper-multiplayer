import {getRandomInt} from './randomNumber';

export const createMines = (minesAmount, firstLimit, lastLimit) => {
  let arr = [];
  for(let i = 0; i < minesAmount; i++) {
    let firstCoordinate = getRandomInt(0, +firstLimit-1);
    let lastCoordinate = getRandomInt(0, +lastLimit-1);
    arr.push({firstCoordinate, lastCoordinate})
  }
  return arr;
}
