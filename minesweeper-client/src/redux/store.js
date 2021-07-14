import {applyMiddleware, combineReducers, createStore} from "redux";
import thunkMiddleware from 'redux-thunk';
import authReducer from "./reducers/authReducer";
import { reducer as formReducer } from 'redux-form';
import socketReducer from "./reducers/socketReducer";
import modalReducer from "./reducers/modalReducer";
import gameReducer from "./reducers/gameReducer";


let reducers = combineReducers({
    auth: authReducer,
    socketPage: socketReducer,
    modalPage: modalReducer,
    gamePage: gameReducer,
    form: formReducer,
});

let store = createStore(reducers, applyMiddleware(thunkMiddleware));

export default store;