import { faL } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import './cookie_banner.css';

function CookieBanner(){
    const [showPopup, setShowCookieBanner] = useState(false);
    useEffect(() => {
        setShowCookieBanner(true);
    },[]);

    const acceptAllCookies = () => {
    localStorage.setItem("cookieConsent", "all");
    setShowCookieBanner(false);
    };

    const acceptNecessaryCookies = () => {
    localStorage.setItem("cookieConsent", "necessary");
    setShowCookieBanner(false);
    };

    const rejectCookies = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setShowCookieBanner(false);
    };

useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");

    if (consent) {
        setShowCookieBanner(false);
    }
}, []);

    return(
        <>
            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        <div>
                            <img className="cookie-picture" src={`/img/cookie_monster.png`}></img>
                        </div>

                        <div className="basic-row">
                            <p className="headline">Gib mir deine Cookies!</p>
                            <p className="subtext">Wir brauchen deine Cookies um...</p>
                            <div className="button-row">
                                <button className="white-button" onClick={()=>rejectCookies()}>Ablehnen</button>
                                <button className="white-button" onClick={()=>acceptNecessaryCookies()}>Nur notwendige Cookies</button>
                                <button className="blue-button" onClick={()=>acceptAllCookies()}>Alle akzeptieren</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
    export default CookieBanner;