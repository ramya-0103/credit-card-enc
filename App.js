import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    cardNumber: "",
    expirationMonth: "",
    expirationYear: "",
    cvc: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulate token generation
    const token = `token_${Math.random().toString(36).substr(2, 9)}`;
    alert(`Token Generated: ${token}`);
  };

  return (
    <div className="app">
      <h1 className="title">Credit Card Form</h1>
      <div className="card-container">
        <form onSubmit={handleSubmit} className="credit-card-form">
          <div className="name-container">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className="form-input"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <input
            type="text"
            name="cardNumber"
            placeholder="Card Number"
            value={formData.cardNumber}
            onChange={handleChange}
            className="form-input"
          />
          <div className="expiration-cvc">
            <input
              type="text"
              name="expirationMonth"
              placeholder="MM"
              value={formData.expirationMonth}
              onChange={handleChange}
              className="form-input small-input"
            />
            <input
              type="text"
              name="expirationYear"
              placeholder="YY"
              value={formData.expirationYear}
              onChange={handleChange}
              className="form-input small-input"
            />
            <input
              type="text"
              name="cvc"
              placeholder="CVC"
              value={formData.cvc}
              onChange={handleChange}
              className="form-input small-input"
            />
          </div>
          <button type="submit" className="submit-btn">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default App;
