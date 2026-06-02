
import { useState } from 'react';
import { Link, NavLink } from "react-router-dom"

import "../App.css";

function Register() {
  const [customerType, setCustomerType] = useState("private");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",

    street: "",
    houseNumber: "",
    zipCode: "",
    city: "",
    country: "Deutschland",

    // Privatkunde
    salutation: "",
    firstName: "",
    lastName: "",
    birthDate: "",

    // Geschäftskunde
    companyName: "",
  });

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };
  

  return (
    <main className="auth-page">
      <NavLink to="/">
        <img src="/img/nav_logo.svg" alt="logo" />
      </NavLink>

  
    <form className="registerform">
      <div className="tab-header">
        <div className="active">Privatkunde</div>
        <div>Geschäftskunde</div>
      </div>
      <div className="registerform-body">
        <div className="priv active">
          <h2>Privatkunde</h2>
          <div className="registerform-input">
            
            <label>
              Anrede
              <select name="anrede" size="1">
                <option></option>
                <option>Herr</option>
                <option>Frau</option>
                <option>Divers</option>
              </select>
            </label>
            
            <label>
              Vorname
              <input
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder=''
                required
              />
            </label>
            <label>
              Nachname
              <input
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder=''
                required
              />
            </label>
            <label>
              Geburtstag
              <input
                type="date"
                max = {new Date().toISOString().split("T")[0]}
                value={formData.birthDate}
                onChange={handleChange}
                placeholder=''
                required
              />
            </label>
            <label>
              Tel.
              <input
                type="text"
                value={formData.phone}
                onChange={handleChange}
                placeholder='0172 1234567'
              />
            </label>
            <label>
              Adresse
              <div className="adress-row">
                <input
                  type="text"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder='Straße'
                  required
                />
                <input
                  type="text"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  placeholder='Nr'
                  required
                />
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder='PLZ'
                  required
                />
                <input
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder='Stadt'
                  required
                />
                <input
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder='Deutschland'
                  required
                />
              </div>
            </label>
            <label>
              E-Mail
              <input
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete='email'
                required
              />
            </label>
            <label>
              Passwort
              <input
                type="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete='new-password'
                minLength={8}
                required
              />
            </label>


          </div>
        </div>
        <div className="company">
          
          <label>
              Unternehmensname
              <input
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                placeholder=''
                required
              />
            </label>
          <label>
              Tel.
              <input
                type="text"
                value={formData.phone}
                onChange={handleChange}
                placeholder='0172 1234567'
              />
            </label>
            <label>
              Adresse
              <div className="adress-row">
                <input
                  type="text"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder='Straße'
                  required
                />
                <input
                  type="text"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  placeholder='Nr'
                  required
                />
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder='PLZ'
                  required
                />
                <input
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder='Stadt'
                  required
                />
                <input
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder='Deutschland'
                  required
                />
              </div>
            </label>
            <label>
              E-Mail
              <input
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete='email'
                required
              />
            </label>
            <label>
              Passwort
              <input
                type="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete='new-password'
                minLength={8}
                required
              />
            </label>

        </div>

      
      </div>

      <button className="btn btn-primary" type="submit">
          Registrieren
        </button>
      <p>
        Bereits registriert? {/* <Link to="/register">Anmelden</Link> */}
      </p>

    </form>
  </main>
  );

}

export default Register;