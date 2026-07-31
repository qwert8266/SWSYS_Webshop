import { NavLink } from "react-router-dom";
import './checkout.css';

function FourOFour(){

    return(
        <div className="d-flex flex-column align-items-center pb-5 pt-5">
            <label className="display-5 text-center pb-5 w-100" style={{ color: "#15406e" }}>Wo treiben Sie sich denn Rum?</label>
            <label className="w-100 fs-5 text-center pb-5">Diese Seite existiert nicht. (404)</label>
            <NavLink to="/home">
                <button className="blue_button">Zurück zur Homepage</button>
            </NavLink>
        </div>
    )

}

export default FourOFour