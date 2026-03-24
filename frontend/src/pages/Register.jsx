import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      alert('Please agree to the Terms & Conditions!');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (fullName && email && phone && pharmacyName && password) {
      localStorage.setItem('user', email);
      navigate('/login');
    } else {
      alert('Please fill all fields!');
    }
  };

  return (
    <div className="register-page">
      {/* Logo and Brand */}
      <div className="register-brand">
        <div className="brand-logo">
          <div className="logo-icon">💊</div>
        </div>
        <div className="brand-text">
          <h2>MediTrack</h2>
          <p>Pharmacy Inventory</p>
        </div>
      </div>

      {/* Register Container */}
      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <h1>Create Account</h1>
            <p>Sign up to start managing your pharmacy</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="register-form">
            {/* Full Name */}
            <div className="form-field">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email */}
            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pharmacy.com"
                required
              />
            </div>

            {/* Phone */}
            <div className="form-field">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>

            {/* Pharmacy Name */}
            <div className="form-field">
              <label htmlFor="pharmacyName">Pharmacy Name</label>
              <input
                type="text"
                id="pharmacyName"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                placeholder="Your Pharmacy Name"
                required
              />
            </div>

            {/* Password */}
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="terms-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>I agree to the <a href="#">Terms & Conditions</a></span>
              </label>
            </div>

            {/* Create Account Button */}
            <button type="submit" className="register-button">
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>Or sign up with</span>
          </div>

          {/* Social Login Buttons */}
          <div className="social-login">
            <button className="social-btn google-btn">
              <img src="https://www.google.com/favicon.ico" alt="Google" />
              <span>Google</span>
            </button>
            <button className="social-btn facebook-btn">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          {/* Sign In Link */}
          <div className="signin-link">
            <p>Already have an account? <a href="/login">Sign In</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;