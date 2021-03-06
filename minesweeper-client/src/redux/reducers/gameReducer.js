import {createMines} from "../../utils/createMines";
import classes from "../../components/Game/Game.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBomb} from "@fortawesome/free-solid-svg-icons";
import React from "react";

const SET_GAME_INFO = 'SET_GAME_INFO';
const SET_TABLE = 'SET_TABLE';
const CHECK_CELL = 'CHECK_CELL';
const FIND_MINE = 'FIND_MINE';


let initialState = {
  gameInfo: null,
  tableTwoDimensional: [],
  isGameOver: false
};

const gameReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_GAME_INFO:
      return {
        ...state,
        gameInfo: action.gameInfo,
      };
    case CHECK_CELL:

      // push the first empty cell/point
      // LOOP until queue non empty
      // pop.head cell and reveal it
      // push the empty surrounding cells of it (8 at maximum)
      // (you must flag the cells so you don't push them again,
      // ie dont push the cells that are already revealed)
      //

      let arr = [];
      let clonedTableTwoDimensional = JSON.parse(JSON.stringify(state.tableTwoDimensional));
      if (clonedTableTwoDimensional[action.i][action.j].isMine) {
        return {
          ...state
        }
      }
      if (clonedTableTwoDimensional[action.i][action.j].amountOfMines !== 0) {
        clonedTableTwoDimensional[action.i][action.j].isOpen = true;
        return {
          ...state,
          tableTwoDimensional: clonedTableTwoDimensional,
        };
      }
      arr.push(clonedTableTwoDimensional[action.i][action.j])
      while (arr.length > 0) {

        let element = arr.shift();
        console.log("ELEMENT", element)
        console.log("clonedTableTwoDimensional", clonedTableTwoDimensional)
        clonedTableTwoDimensional[element.i][element.j].isOpen = true;

        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (clonedTableTwoDimensional[element.i - 1 + i] && clonedTableTwoDimensional[element.i - 1 + i][element.j - 1 + j]) {
              if (clonedTableTwoDimensional[element.i - 1 + i][element.j - 1 + j].amountOfMines === 0 && clonedTableTwoDimensional[element.i - 1 + i][element.j - 1 + j].isOpen === false) {
                arr.push(clonedTableTwoDimensional[element.i - 1 + i][element.j - 1 + j])
              }
              clonedTableTwoDimensional[element.i - 1 + i][element.j - 1 + j].isOpen = true
            }

          }
        }
      }

      return {
        ...state,
        tableTwoDimensional: clonedTableTwoDimensional,
      };
    case FIND_MINE:
      let clonedTable = JSON.parse(JSON.stringify(state.tableTwoDimensional));
      clonedTable[action.i][action.j].isOpen = true;
      if (clonedTable[action.i][action.j].isMine) {
        clonedTable[action.i][action.j].isBlownUp = true;
      }
      // clonedTable[action.i][action.j].isMine
      return {
        ...state,
        tableTwoDimensional: clonedTable,
        isGameOver: clonedTable[action.i][action.j].isMine,
      };

    case SET_TABLE:

      let firstPoint = 1;
      let sizeOfField = state.gameInfo.fieldSize.split('x');
      let coordinatesForMines = createMines(state.gameInfo.minesAmount, +sizeOfField[1], +sizeOfField[0]);

      let lastPoint = +sizeOfField[0];
      let tableTwoDimensional = [];
      for (let i = 1; i <= sizeOfField[1]; i++) {
        let data = []
        for (let j = firstPoint; j <= lastPoint; j++) {
          data.push({isMine: false, isOpen: false, isChecked: false})
        }
        firstPoint += +sizeOfField[0]
        lastPoint += +sizeOfField[0]
        tableTwoDimensional.push(data)
      }

      coordinatesForMines.forEach(item => {
        tableTwoDimensional[item.firstCoordinate][item.lastCoordinate].isMine = true;
      })

      for (let i = 0; i < tableTwoDimensional.length; i++) {
        for (let j = 0; j < tableTwoDimensional[i].length; j++) {
          tableTwoDimensional[i][j].i = i;
          tableTwoDimensional[i][j].j = j;
          let amountMines = 0;
          if (!tableTwoDimensional[i][j].isMine) {
            (tableTwoDimensional[i][j - 1] && tableTwoDimensional[i][j - 1].isMine) ? amountMines += 1 : amountMines += 0;
            (tableTwoDimensional[i][j + 1] && tableTwoDimensional[i][j + 1].isMine) ? amountMines += 1 : amountMines += 0;
            (tableTwoDimensional[i - 1] && tableTwoDimensional[i - 1][j].isMine) ? amountMines += 1 : amountMines += 0;
            (tableTwoDimensional[i + 1] && tableTwoDimensional[i + 1][j].isMine) ? amountMines += 1 : amountMines += 0;
            (tableTwoDimensional[i + 1] && tableTwoDimensional[i + 1][j - 1] && tableTwoDimensional[i + 1][j - 1].isMine) ? amountMines += 1 : amountMines += 0;
            (tableTwoDimensional[i + 1] && tableTwoDimensional[i + 1][j + 1] && tableTwoDimensional[i + 1][j + 1].isMine) ? amountMines += 1 : amountMines += 0;
            (tableTwoDimensional[i - 1] && tableTwoDimensional[i - 1][j + 1] && tableTwoDimensional[i - 1][j + 1].isMine) ? amountMines += 1 : amountMines += 0;
            (tableTwoDimensional[i - 1] && tableTwoDimensional[i - 1][j - 1] && tableTwoDimensional[i - 1][j - 1].isMine) ? amountMines += 1 : amountMines += 0;
          }
          tableTwoDimensional[i][j].amountOfMines = amountMines;
        }
      }

      return {
        ...state,
        tableTwoDimensional: tableTwoDimensional,
      };
    default:
      return state;
  }
};

export const setGameInfo = (gameInfo) => ({type: SET_GAME_INFO, gameInfo});
export const setTable = () => ({type: SET_TABLE});
export const checkCell = (i, j) => ({type: CHECK_CELL, i, j});
export const findMine = (i, j) => ({type: FIND_MINE, i, j});
export const setGameInfoAndSetTable = (gameInfo) => async (dispatch) => {
  dispatch(setGameInfo(gameInfo));
  dispatch(setTable());
};
export default gameReducer;