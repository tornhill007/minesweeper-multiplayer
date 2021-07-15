import React from "react";
import {connect} from "react-redux";
import {withRouter} from 'react-router-dom';
import classes from './Game.module.css';
import {createMines} from "../../utils/createMines";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBomb} from "@fortawesome/free-solid-svg-icons";
import {checkCell, findMine} from "../../redux/reducers/gameReducer";



class Game extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isGaming: true,
      isRender: false
    }
  }




  render() {
    console.log("tableTwoDimensionalOPENED", this.props.gameInfo);
    console.log("tableTwoDimensionalOPENED1", this.props);
    console.log("tableTwoDimensionalOPENED", this.props.tableTwoDimensional);

    let isGameOver = this.props.isGameOver;

    const sendAction = (i, j) => {
      // this.props.checkCell(i, j)
      this.props.socket.emit("game/action", {i, j}, (data) => {
        console.log(['data'], data)
      })
    }


    const checkCell = (i, j) => {
      this.props.checkCell(i, j)
    }

    const findMine = (i, j) => {
      this.props.findMine(i, j)
    }


    // const checkCell = (i,j, tableTwoDimensional) => {
    //   console.log("CELL",i, j, tableTwoDimensional)
    //   if(tableTwoDimensional[i][j].isOpen) {
    //     return;
    //   }
    //   if(tableTwoDimensional[i][j].amountOfMines !== 0) {
    //     return
    //   }
    //   tableTwoDimensional[i][j].isOpen = true;
    //   tableTwoDimensional[i-1] && checkCell(i-1, j, tableTwoDimensional);
    //   tableTwoDimensional[i+1] && checkCell(i+1, j, tableTwoDimensional);
    //   tableTwoDimensional[i][j-1] && checkCell(i, j-1, tableTwoDimensional);
    //   tableTwoDimensional[i][j+1] && checkCell(i, j+1,tableTwoDimensional);
    //
    //   this.setState({
    //     isRender: true
    //   })
    //
    //   console.log("tableTwoDimensionalOPENED", tableTwoDimensional);
    // }

    // функция Проверить ячейку (ячейка)
    // если ячейка проверерена -> выход
    // если ячейка не пустая -> выход
    //
    // Отметить, что ячейка проверена, чтобы не проверять дважды.
    //
    //   Проверить ячейку сверху если есть
    // Проверить ячейку снизу если есть
    // Проверить ячейку слева если есть
    // Проверить ячейку справа если есть
    // конец функции

    // const drawingMap = (tableTwoDimensional) => {
    //   for(let i = 0; i < tableTwoDimensional.length; i++) {
    //     for(let j = 0; j < tableTwoDimensional[i].length; j++) {
    //       let amountMines = 0;
    //       if(!tableTwoDimensional[i][j].isMine) {
    //         (tableTwoDimensional[i][j-1] && tableTwoDimensional[i][j-1].isMine) ? amountMines += 1 : amountMines += 0;
    //         (tableTwoDimensional[i][j+1] && tableTwoDimensional[i][j+1].isMine) ? amountMines += 1 : amountMines += 0;
    //         (tableTwoDimensional[i-1] && tableTwoDimensional[i-1][j].isMine) ? amountMines += 1 : amountMines += 0;
    //         (tableTwoDimensional[i+1] && tableTwoDimensional[i+1][j].isMine) ? amountMines += 1 : amountMines += 0;
    //         (tableTwoDimensional[i+1] && tableTwoDimensional[i+1][j-1] && tableTwoDimensional[i+1][j-1].isMine) ? amountMines += 1 : amountMines += 0;
    //         (tableTwoDimensional[i+1] && tableTwoDimensional[i+1][j+1] && tableTwoDimensional[i+1][j+1].isMine) ? amountMines += 1 : amountMines += 0;
    //         (tableTwoDimensional[i-1] && tableTwoDimensional[i-1][j+1] && tableTwoDimensional[i-1][j+1].isMine) ? amountMines += 1 : amountMines += 0;
    //         (tableTwoDimensional[i-1] && tableTwoDimensional[i-1][j-1] && tableTwoDimensional[i-1][j-1].isMine) ? amountMines += 1 : amountMines += 0;
    //       }
    //       tableTwoDimensional[i][j].amountOfMines = amountMines;
    //     }
    //   }
    // }

    // const findMine = (i, j, tableTwoDimensional) => {
    //   // tableTwoDimensional[i][j].isOpen = true;
    //   tableTwoDimensional[i][j].isMine && this.setState({
    //     isGaming: false
    //   })
    // }


    let rows = this.props.tableTwoDimensional.map(function (item, i){
      let entry = item.map(function (element, j) {
console.log("element", element)
        return (
          // <td onClick={() => {checkCell(i, j); findMine(i, j)}} className={classes.itemCell} key={j}> {element.isMine ? <FontAwesomeIcon icon={faBomb} /> : (element.isOpen && element.amountOfMines === 0) ? '' : element.amountOfMines} </td>
          // <td onClick={() => {checkCell(i, j); findMine(i, j)}} className={`${element.isBlownUp && classes.blownUpBackground} ${element.isOpen && !element.isMine && element.amountOfMines === 0 && classes.emptyOpened} ${classes.itemCell}`} key={j}> {element.isMine && isGameOver ? <FontAwesomeIcon icon={faBomb} /> : (element.isOpen && !element.isMine && element.amountOfMines > 0 && element.amountOfMines) } </td>
          <td onClick={() => {sendAction(i, j)}} className={`${element.isBlownUp && classes.blownUpBackground} ${element.isOpen && !element.isMine && element.amountOfMines !== 0 && classes.emptyOpened} ${element.isOpen && !element.isMine && element.amountOfMines === 0 && classes.emptyOpened} ${classes.itemCell}`} key={j}> {element.isMine && element.isBlownUp ? <FontAwesomeIcon icon={faBomb} /> : (element.isOpen && !element.isMine && element.amountOfMines > 0 && element.amountOfMines) } </td>
        );
      });
      return (
        <tr key={i}> {entry} </tr>
      );
    });

    // let table = []


    // let firstPoint = 1;
    // let sizeOfField = this.props.gameInfo.fieldSize.split('x');
    // let coordinatesForMines = createMines(this.props.gameInfo.minesAmount, +sizeOfField[1], +sizeOfField[0]);
    //
    // let lastPoint = +sizeOfField[0];
    // let tableTwoDimensional = [];
    // for (let i = 1; i <= sizeOfField[1]; i++) {
    //   let data = []
    //   for(let j = firstPoint; j <= lastPoint; j++) {
    //     data.push({isMine: false, isOpen: false})
    //   }
    //   firstPoint += +sizeOfField[0]
    //   lastPoint += +sizeOfField[0]
    //   tableTwoDimensional.push(data)
    // }
    //
    // coordinatesForMines.forEach(item => {
    //   // console.log(tableTwoDimensional)
    //   // console.log(tableTwoDimensional)
    //   tableTwoDimensional[item.firstCoordinate][item.lastCoordinate].isMine = true;
    // })
    //
    // drawingMap(tableTwoDimensional)
    //
    // let rows = tableTwoDimensional.map(function (item, i){
    //   let entry = item.map(function (element, j) {
    //
    //     return (
    //       <td onClick={() => {checkCell(i, j, tableTwoDimensional); findMine(i, j, tableTwoDimensional)}} className={classes.itemCell} key={j}> {element.isMine ? <FontAwesomeIcon icon={faBomb} /> : (element.isOpen && element.amountOfMines === 0) ? 'x' : element.amountOfMines} </td>
    //     );
    //   });
    //   return (
    //     <tr key={i}> {entry} </tr>
    //   );
    // });



    // let table = []
    // let firstPoint = 1;
    // let sizeOfField = this.props.gameInfo.fieldSize.split('x');
    // let lastPoint = +sizeOfField[0];
    // console.log(firstPoint, lastPoint)
    // for (let i = 1; i <= sizeOfField[1]; i++) {
    //   let data = []
    //   for(let j = firstPoint; j <= lastPoint; j++) {
    //     data.push(<td>{j}</td>)
    //   }
    //   firstPoint += +sizeOfField[0]
    //   lastPoint += +sizeOfField[0]
    //   table.push(<tr>{data}</tr>)
    // }

    return (
      <div>

{/*<div onClick={() => {drawingMap(tableTwoDimensional)}}>DRAWING MAP</div>*/}
        {this.props.isGameOver && <div>GAME OVER</div>}
        <table>
        {rows}
      </table>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  gameInfo: state.gamePage.gameInfo,
  tableTwoDimensional: state.gamePage.tableTwoDimensional,
  isGameOver: state.gamePage.isGameOver,
  socket: state.socketPage.socket
})

export default withRouter(connect(mapStateToProps, {checkCell, findMine
})(Game));
