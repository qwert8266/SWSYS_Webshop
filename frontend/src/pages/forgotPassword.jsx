import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import authApi from "../api/authApi";
import { EMAIL_REGEX } from "../constants/validation";
import { ERROR_INVALID_EMAIL } from "../constants/errorMessages";


function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

   async function handleSubmit(event) {
    event.preventDefault();
    setSuccessMessage("");
    setError("");

    const trimmedEmail = email.trim().toLowerCase();

    if  (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(ERROR_INVALID_EMAIL);
      return;
    }

    setIsSubmitting(true);

    try {
        await authApi.requestPasswordReset(trimmedEmail);
        setSuccessMessage(
          `Wir haben weitere Anweisungen zum zurücksetzen des Passwortes an ${email} gesendet.`
        );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <NavLink to="/">
        <img src="/img/nav_logo.svg" alt="logo" />
      </NavLink>

      <form className="registerform card shadow-sm border-0" onSubmit={handleSubmit}>
         <div className="registerform-body">
          <div className="registerform-input row g-2">
            
            <h2 className="h4 mb-0 text-center">Passwort vergessen?</h2>
            <p className="mb-4">
              Bitte geben Sie hier Ihre E-Mail-Adresse an. Wir senden Ihnen weitere Anweisungen, wie Sie Ihr Passwort zurücksetzen können.
            </p>

            {error && <p className="auth-error">{error}</p>}
            {successMessage && <p className="auth-success">{successMessage}</p>}
            
            <div className="row align-items-center mb-4">
              <label className="col-sm-2 col-form-label">
                  E-Mail
                </label>
                <div className="col-sm-9">
                  <input
                    className="form-control"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="schmidt@t-online.de"
                    required
                  />
                </div>
            </div>

            

            <button 
              className="btn btn-primary btn-lg submit-register-btn" 
              type="submit"
              disabled={isSubmitting}  
            >
              {isSubmitting ? "Passwort zurücksetzen wird vorbereitet..." : "Passwort zurücksetzen"}
            </button>
            
            <div className="col-sm-12 text-center">
              <p>
                Zurück zur <Link to="/login">Anmeldung</Link> 
              </p>
            </div>

          </div>
        </div>

      </form>
    </main>
  );

}

export default ForgotPassword;