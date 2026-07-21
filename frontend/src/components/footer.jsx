import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWineGlass,
  faBeerMugEmpty,
  faWhiskeyGlass,
  faWineBottle,
  faBottleWater,
  faMugHot,
} from '@fortawesome/free-solid-svg-icons';
import { CATEGORY_CONFIGS } from '../utils/categoryConfig';
import './footer.css';

const FOOTER_CATEGORY_ICONS = {
  bier: faBeerMugEmpty,
  spirituosen: faWhiskeyGlass,
  'wein-sekt': faWineGlass,
  softgetraenke: faWineBottle,
  wasser: faBottleWater,
  'kaffee-tee': faMugHot,
};

const SORTIMENT_CATEGORIES = CATEGORY_CONFIGS.filter(
  (category) => category.slug !== 'angebote'
);

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="logo-container">
          <NavLink className="navbar-brand" to="/">
            <img className="logo" src="/img/nav_logo_oval.png" alt="logo" />
          </NavLink>
        </div>

        <div className="footer-column">
          <p className="title">Sortiment</p>
          {SORTIMENT_CATEGORIES.map((category) => {
            const icon = FOOTER_CATEGORY_ICONS[category.slug];

            return (
              <NavLink
                key={category.slug}
                className="footer-link"
                to={`/sortiment/${category.slug}`}
              >
                {icon && (
                  <FontAwesomeIcon icon={icon} className="me-2" />
                )}
                {category.name}
              </NavLink>
            );
          })}
        </div>

        <div className="footer-column">
          <p className="title">Rechtliche Hinweise</p>
          <NavLink className="footer-link" to="/impressum">Impressum</NavLink>
          <NavLink className="footer-link" to="/agb">AGB</NavLink>
          <NavLink className="footer-link" to="/datenschutzerklärung">Datenschutzerklärung</NavLink>
          <NavLink className="footer-link" to="/nutzungsbedingungen">Nutzungsbedingungen</NavLink>
        </div>

        <div className="footer-column">
          <p className="title">Kontakt</p>
          <NavLink className="footer-link" to="/contact">Karriere</NavLink>
          <NavLink className="footer-link" to="/contact">Beschwerden</NavLink>
          <NavLink className="footer-link" to="/contact">Großbestellung</NavLink>
        </div>

        <div className="footer-column">
          <p className="title">Social Media</p>
          <NavLink className="footer-link" to="/instagram">
            <i className="bi bi-instagram me-2"></i>
            Instagram
          </NavLink>
          <NavLink className="footer-link" to="/facebook">
            <i className="bi bi-facebook me-2"></i>
            Facebook
          </NavLink>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Ctrl+Alt+Deluxe</p>
      </div>
    </footer>
  );
}

export default Footer;
