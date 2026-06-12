import { useState } from 'react';
import { Link, NavLink, useNavigate } from "react-router-dom"

import { EMAIL_REGEX } from "../constants/validation";
import { ERROR_EMPTY_PASSWORD, ERROR_INVALID_EMAIL } from "../constants/errorMessages";


function Login(){
    const navigate = useNavigate();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setIsLoggingIn(false);

    // Fehler wenn kein Passwort eingetragen wurde.
    if(formData.password === ""){
        setError(ERROR_EMPTY_PASSWORD);
        setIsLoggingIn(false);
        return;
    }

    // temp: In der Datenbank nach mail suchen
    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        setError(ERROR_INVALID_EMAIL);
        setIsLoggingIn(false);
        return;
    }

    try {
        await Login(trimmedEmail, formData.password);
        navigate("/account");
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoggingIn(false);
    }
  }

  return (
    <main className="auth-page">
      <NavLink to="/">
        <img src="/img/nav_logo.svg" alt="logo" />
      </NavLink>
      <form className="registerform card shadow-sm border-0" onSubmit={handleLogin}>
         <hr className="my-2" /> {/* Trennlinie */}
            <h3 className="h5 mb-3">Wilkommen zurück!</h3>

            <div className="row align-items-center mb-3">
        <label className="col-sm-2 col-form-label">
            E-Mail
        </label>

        <div className="col-sm-9">
            <input
            className="form-control"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="schmidt@t-online.de"
            />
        </div>
        </div>

        <div className="row align-items-center mb-3">
        <label className="col-sm-2 col-form-label">
            Passwort
        </label>

        <div className="col-sm-9">
            <input
            className="form-control"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            minLength={8}
            />
        </div>
        </div>

        <button 
            className="btn btn-primary btn-lg submit-register-btn" 
            type="submit"
            disabled={isLoggingIn}  
        >
            {isLoggingIn ? "Anmeldung läuft..." : "Anmelden"}
        </button>
        <p>
            Noch kein Kunde?  <Link to="/register">Registrieren</Link> 
        </p>
      </form>
    </main>
  )
}

export default Login