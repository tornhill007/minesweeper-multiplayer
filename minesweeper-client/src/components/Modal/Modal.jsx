import React from "react";
import './style.css'

class Modal extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
        const {isOpen, content} = this.props.modalPage;
        console.log("content", content);
        if (!isOpen) return null;

        return (
            <div className="modal">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{content.props.title}</h5>
                            <button type="button" className="close">
                                <span>&times;</span>
                            </button>
                        </div>
                        {content}
                    </div>
                </div>
            </div>
        )
    }
}

export default Modal;