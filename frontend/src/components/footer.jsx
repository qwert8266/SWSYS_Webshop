import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWineGlass, faBeerMugEmpty, faWhiskeyGlass, faWineBottle } from '@fortawesome/free-solid-svg-icons';
import './footer.css';
function Footer(){



    return(
      <div className="background">
        <footer className="footer">
          <div className="logo-container">
            <NavLink className="navbar-brand" to="/">
            <img className="logo" src="/img/nav_logo_oval.png" alt="logo" /> 
            </NavLink>
          </div>
          
          <div className="footer-column">
            <p className="title">Sortiment</p>
            <NavLink className="footer-link" to="/bier">
              <FontAwesomeIcon icon={faBeerMugEmpty} className="me-2"></FontAwesomeIcon>
              Bier
            </NavLink>
            <NavLink className="footer-link" to="/schnaps">
              <FontAwesomeIcon icon={faWhiskeyGlass} className="me-2"></FontAwesomeIcon>
              Schnaps
            </NavLink>
            <NavLink className="footer-link" to="/wein">
              <FontAwesomeIcon icon={faWineGlass} className="me-2"></FontAwesomeIcon>
              Wein
            </NavLink>
            <NavLink className="footer-link" to="/veterano">
              <FontAwesomeIcon icon={faWineBottle} className="me-2"></FontAwesomeIcon>
              Veterano
            </NavLink>
          </div>
          
          <div className="footer-column">
            <p className="title" >Rechtliche Hinweise</p>
            <NavLink className="footer-link" to="/impressum">Impressum</NavLink>
            <NavLink className="footer-link" to="/datenschutzerklärung">Datenschutzerklärung</NavLink>
            <NavLink className="footer-link" to="/nutzungsbedingungen">Nutzungsbedingungen</NavLink>
          </div>

          <div className="footer-column">
            <p className="title" >Kontakt</p>
            <NavLink className="footer-link" to="/jobs">Karriere</NavLink>
            <NavLink className="footer-link" to="/fuck_you">Beschwerden</NavLink>
            <NavLink className="footer-link" to="/kontaktformular">Kontaktformular</NavLink>
            
          </div>

          <div className="footer-column">
            <p className="title" >Social Media</p>
            <NavLink className="footer-link" to="/instagram">
              <i className="bi bi-instagram me-2"></i>
              Instagram
            </NavLink>
            <NavLink className="footer-link" to="/facebook">
              <i className="bi bi-facebook me-2"></i>
              Facebook
            </NavLink>
            <NavLink className="footer-link" to="/onlyfans">
              <i className="bi bi-person-arms-up me-2"></i>
              OnlyFans
            </NavLink>
          </div>

          </footer>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Ctrl+Alt+Deluxe</p>
          </div>

      </div>
      
      
      
    );
}
// Bspw.:
// Logo links angeordnet
// Produkte: Sortiment und auflistung aller Unterkategorien
// Rechtliche Hinweise: Impressum, Datenschutzerklärung, Nutzungsbedingungen, ...
// Kontakt: Kontaktformular, ...
// Social Media Links
// (Newsletter)
export default Footer