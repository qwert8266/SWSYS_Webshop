
import { useState } from 'react';
import { Link, NavLink, useNavigate } from "react-router-dom"

import { EMAIL_REGEX } from "../constants/validation";
import { ERROR_INVALID_EMAIL } from "../constants/errorMessages";
import { useAuth } from "../context/authContext";
import "../App.css";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  //const [customerType, setCustomerType] = useState("private");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    customerType: "private",
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
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const customerType = formData.customerType;
  const handleCustomerTypeChange = (type) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      customerType: type
    }));
  };
  
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    /*const trimmedEmail = formData.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(ERROR_INVALID_EMAIL);
      setIsSubmitting(false);
      return;
    }*/

    try {
      await register(formData);
      navigate("/account");
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
      {error && <p className="auth-error">{error}</p>}
      
      <div className="customer-type-tabs">
        {/* check which form is selected */}
        <div 
          className={`customer-type-tab ${customerType === "private" ? "active" : ""}`}
          onClick={() => handleCustomerTypeChange("private")}
        >
          Privatkunde
        </div>
        <div 
          className={`customer-type-tab ${customerType === "business" ? "active" : ""}`}
          onClick={() => handleCustomerTypeChange("business")}
        >
          Geschäftskunde
          </div>
      </div>

      <div className="registerform-body">
        
        {/*<div className={`priv ${customerType === "private" ? "active" : ""}`}>*/}
        {customerType === "private" && (
          <>
          <div className="registerform-input row g-2">
            <h2 className="h4 mb-3">Privatkonto</h2>

            <div className="row align-items-center mb-0">
              <label className="col-sm-3 col-form-label">
                Anrede
              </label>
              <div className="col-sm-3">
                <select 
                  className="form-select lh-1"
                  name="salutation" 
                  size="1"
                  value={formData.salutation}
                  onChange={handleChange}  
                  required={customerType === "private"}
                  disabled={customerType !== "private"}
                >
                  <option></option>
                  <option>Herr</option>
                  <option>Frau</option>
                  <option>Divers</option>
                </select>
              </div>
            </div>
              
            <div className="row align-items-center mb-1">
              <label className="col-sm-3 col-form-label">
                Vorname
              </label>
              <div className="col-sm-6">
                <input
                  className="form-control"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required={customerType === "private"}
                  disabled={customerType !== "private"}
                />
              </div>
            </div>

            <div className="row align-items-center mb-1">
              <label className="col-sm-3 col-form-label">
                Nachname
              </label>
              <div className="col-sm-6">
                <input
                  className="form-control"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required={customerType === "private"}
                  disabled={customerType !== "private"}
                />
              </div>
            </div>
            

            <div className="row align-items-center mb-1">
              <label className="col-sm-3 col-form-label">
                Geburtstag
              </label>
              <div className="col-sm-4">
                <input
                  className="form-control"
                  type="date"
                  name="birthDate"
                  max = {new Date().toISOString().split("T")[0]}
                  value={formData.birthDate}
                  onChange={handleChange}
                  required={customerType === "private"}
                  disabled={customerType !== "private"}
                />
              </div>
            </div>

            <div className="row align-items-center mb-3">
              <label className="col-sm-3 col-form-label">
                Tel.
              </label>
              <div className="col-sm-6">
                <input
                  className="form-control"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder='0172 1234567'
                />
              </div>
            </div>

            <hr className="my-2 mb-1" /> {/* Trennlinie */}
            <h3 className="h5 mb-1">Adresse</h3>
            
            <div className='row g-1 mb-0'>
              <div className="col-md-9">
                <input
                  className="form-control"
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder='Straße'
                  required={customerType === "private"}
                  disabled={customerType !== "private"}
                />
              </div>
                  
              <div className="col-md-2">
                <input
                  className='form-control'
                  type="text"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  placeholder='Nr'
                  required={customerType === "private"}
                  disabled={customerType !== "private"}
                />
              </div>
            </div>

            <div className='row g-1 mb-2'>
              <div className="col-md-2">
                  <input
                    className='form-control'
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder='PLZ'
                    required={customerType === "private"}
                  disabled={customerType !== "private"}
                  />
              </div>
              <div className="col-md-5">
                  <input
                    className='form-control'
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder='Stadt'
                    required={customerType === "private"}
                  disabled={customerType !== "private"}
                  />
              </div>
              <div className="col-md-4">
                <input
                  className='form-control'
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required={customerType === "private"}
                  disabled={customerType !== "private"}
                />
              </div>  
            </div>
            

            <hr className="my-2" /> {/* Trennlinie */}
            <h3 className="h5 mb-3">Zugangsdaten</h3>
            
            <label className="col-sm-2 col-form-label">
              E-Mail
            </label>
            <div className="col-sm-9">
              <input
                className='form-control'
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete='email'
                placeholder=' schmidt@t-online.de'
                required={customerType === "private"}
                disabled={customerType !== "private"}
              />
            </div>

              <label className="col-sm-2 col-form-label">
                Passwort
              </label>
              <div className="col-sm-9">
                <input
                  className='form-control'
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete='new-password'
                  minLength={8}
                  required={customerType === "private"}
                  disabled={customerType !== "private"}
                />
              </div>
            
            </div>
          </>
        )}
      
        {/*<div className={`company ${customerType === "business" ? "active" : ""}`}>*/}
        {customerType === "business" && (
          <>         
          <div className="registerform-input row g-2">
            <h2 className="h4 mb-3 pl-2">Geschäftskonto</h2>
            
            <div className="row align-items-center mb-3">
              <label className="col-sm-3 col-form-label">
                Unternehmen
              </label>
              <div className="col-sm-5">
                <input
                  className="form-control"
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder=''
                  required={customerType === "business"}
                  disabled={customerType !== "business"}
                />
              </div>
            </div>

            <div className="row align-items-center mb-0">
              <label className="col-sm-3 col-form-label">
                Anrede
              </label>
              <div className="col-sm-3">
                <select 
                  className="form-select lh-1"
                  name="salutation" 
                  size="1"
                  value={formData.salutation}
                  onChange={handleChange}
                  required={customerType === "business"}
                  disabled={customerType !== "business"}  
                >
                  <option></option>
                  <option>Herr</option>
                  <option>Frau</option>
                  <option>Divers</option>
                </select>
              </div>
            </div>
              
            <div className="row align-items-center mb-1">
              <label className="col-sm-3 col-form-label">
                Vorname
              </label>
              <div className="col-sm-6">
                <input
                  className="form-control"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required={customerType === "business"}
                  disabled={customerType !== "business"}
                />
              </div>
            </div>

            <div className="row align-items-center mb-1">
              <label className="col-sm-3 col-form-label">
                Nachname
              </label>
              <div className="col-sm-6">
                <input
                  className="form-control"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required={customerType === "business"}
                  disabled={customerType !== "business"}
                />
              </div>
            </div>

            <div className="row align-items-center mb-2">
              <label className="col-sm-3 col-form-label">
                Tel.
              </label>
              <div className="col-sm-5">
                <input
                  className="form-control"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder='0172 1234567'
                />
              </div>
            </div>
            
            <hr className="my-2 mb-1" /> {/* Trennlinie */}
            <h3 className="h5 mb-1">Adresse</h3>
            
            <div className='row g-1 mb-0'>
              <div className="col-md-9">
                <input
                  className="form-control"
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder='Straße'
                  required={customerType === "business"}
                  disabled={customerType !== "business"}
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="text"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  placeholder='Nr'
                  required={customerType === "business"}
                  disabled={customerType !== "business"}
                />
              </div>
            </div>

            <div className='row g-1 mb-2'>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder='PLZ'
                  required={customerType === "business"}
                  disabled={customerType !== "business"}
                />
              </div>
              <div className="col-md-5">
                <input
                  className="form-control"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder='Stadt'
                  required={customerType === "business"}
                  disabled={customerType !== "business"}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder='Deutschland'
                  required={customerType === "business"}
                  disabled={customerType !== "business"}
                />
              </div>
            </div>
            
            <hr className="my-2" /> {/* Trennlinie */}
            <h3 className="h5 mb-3">Zugangsdaten</h3>

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
                autoComplete='email'
                placeholder=' schmidt@t-online.de'
                required={customerType === "business"}
                disabled={customerType !== "business"}
              />
            </div>

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
                autoComplete='new-password'
                minLength={8}
                required={customerType === "business"}
                disabled={customerType !== "business"}
              />
            </div>

          </div>
          </>
        )}
      </div>

      <button 
        className="btn btn-primary btn-lg submit-register-btn" 
        type="submit"
        disabled={isSubmitting}  
      >
        {isSubmitting ? "Registrierung läuft..." : "Registrieren"}
      </button>
      <p>
        Bereits registriert?  <Link to="/login">Anmelden</Link> 
      </p>

    </form>
  </main>
  );

}

export default Register;