const OPEN_MODAL = 'OPEN_MODAL';
const CLOSE_MODAL = 'CLOSE_MODAL';

let initialState = {
  isOpen: false,
  content: null,
};

const modalReducer = (state = initialState, action) => {
  switch (action.type) {
    case OPEN_MODAL:
      return {
        ...state,
        isOpen: true,
        content: action.content
      };

    case CLOSE_MODAL:
      return {
        ...state,
        isOpen: false
      };
    default:
      return state;
  }
};

export const openModal = (content) => ({type: OPEN_MODAL, content});
export const closeModal = () => ({type: CLOSE_MODAL});

export default modalReducer;