import React from "react";
import {setGameInfo, setGameInfoAndSetTable} from "../../../redux/reducers/gameReducer";

class EditModal extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      fieldSize: null,
      gameName: '',
      maxPlayers: '',
      minesAmount: '',
    }
  }

  onChangeGameName = (e) => {
    this.setState({
      gameName: e.target.value
    })
  }

  onChangeFieldSize = (e) => {
    this.setState({
      fieldSize: e.target.value
    })
  }

  onChangeMaxPlayers = (e) => {
    this.setState({
      maxPlayers: +e.target.value
    })
  }

  onChangeMinesAmount = (e) => {
    this.setState({
      minesAmount: +e.target.value
    })
  }

  createGame = () => {
    console.log("this.props.socket", this.props.socket)
    this.props.socket.emit('game/create', {gameInfo: this.state}, (data) => {
      console.log(['data'], data)
    })
    console.log("Form_Data", this.state);
    // this.props.setGameInfoAndSetTable(this.state)
    // this.props.setGameInfoAndSetTable(this.state)
    // this.props.setGameInfo(this.state);
    // this.props.history.push('/game')
  }


  render() {
    console.log(this.state.gameName)
    console.log(this.state.minesAmount)
    console.log(this.state.maxPlayers)
    console.log(this.state.fieldSize)

    let regex = /^([1-9]|10)$/;

    return (
      <div>
        <div className="modal-body">
          <input value={this.state.gameName} onChange={this.onChangeGameName} placeholder={"game name"} type="text"/>
          <select onChange={this.onChangeFieldSize} name="select">
            <option selected disabled={true}>Choose field size</option>
            <option value={'9x9'}>9x9</option>
            <option value={'16x16'}>16x16</option>
            <option value={'30x16'}>30x16</option>
          </select>
          <input value={this.state.minesAmount} onChange={this.onChangeMinesAmount} placeholder={"amount of mines"}
                 type="text"/>
          <input value={this.state.maxPlayers} onChange={this.onChangeMaxPlayers} placeholder={"max players (1-10)"}
                 type="text"/>
        </div>
        <div onClick={() => {this.createGame()}}>Create game</div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => this.props.closeModal()}>Close</button>
        </div>
      </div>
    )
  }
}

export default EditModal;