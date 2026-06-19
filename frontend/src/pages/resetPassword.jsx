import { useSearchParams, Link, NavLink } from "react-router-dom";
import authApi from "../api/authApi";
import { useState } from "react";
import "../App.css";

function ResetPassword() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");

    // Get the One-time-Token from the URL 
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [formData, setFormData] = useState({
        password: "",
        repeatPassword: "",
    });

    const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccessMessage("");
    setError("");

    /* Error Handling */
    if (!token) {
        setError("Password-Reset-Link ist ungültig oder unvollständig.");
        return;
    }

    if (formData.password.length < 8) {
        setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
        return;
    }

    if (formData.password !== formData.repeatPassword) {
        setError("Die beiden Passwörter stimmen nicht überein.");
        return;
    }

    setIsSubmitting(true);

    try {
        await authApi.confirmPasswordReset({
            token,
            password: formData.password,
        });
        setSuccessMessage("Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt mit deinem neuen Passwort anmelden.");
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
            
            <h2 className="h4 mb-5 text-center">Passwort zurücksetzen</h2>
            {error && <p className="auth-error">{error}</p>}
            {successMessage && <p className="auth-success">{successMessage}</p>}
            
            <div className="row align-items-center mb-3">
              <label className="col-sm-5 col-form-label">
                Neues Passwort
              </label>
              <div className="col-sm-7">
                <input
                  className='form-control'
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete='new-password'
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="row align-items-center mb-4">
              <label className="col-sm-5 col-form-label">
                Neues Passwort wiederholen
              </label>
              <div className="col-sm-7">
                <input
                  className='form-control'
                  type="password"
                  name="repeatPassword"
                  value={formData.repeatPassword}
                  onChange={handleChange}
                  autoComplete='new-password'
                  minLength={8}
                  required
                />
              </div>
            </div>

            <button 
              className="btn btn-primary btn-lg submit-register-btn" 
              type="submit"
              disabled={isSubmitting || !token}  
            >
              {isSubmitting ? "Passwort wird geändert..." : "Passwort ändern"}
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

export default ResetPassword;