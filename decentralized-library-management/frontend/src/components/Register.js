import React, { useState } from 'react';
import { connectWallet, registerUser } from '../utils/interact';

function Register({ onRegisterComplete }) {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleConnectWallet = async () => {
    setLoading(true);
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWalletAddress(walletResponse.address);
    setLoading(false);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!walletAddress) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (!userName.trim()) {
      setStatus("Please enter your name");
      return;
    }
    
    if (!userEmail.trim()) {
      setStatus("Please enter your email");
      return;
    }
    
    if (!validateEmail(userEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    } else {
      setEmailError("");
    }

    setLoading(true);
    setStatus("Registering user... Please confirm in MetaMask");
    const registerResult = await registerUser(userName, userEmail);
    setStatus(registerResult.status);

    if (registerResult.success) {
      setTimeout(() => {
        onRegisterComplete();
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Your Library Account</h2>
        <p>Connect your wallet and complete your profile to register</p>

        <div className="register-steps">
          <div className="register-step">
            <h3>Step 1: Connect Wallet</h3>
            <button 
              onClick={handleConnectWallet} 
              disabled={loading || walletAddress}
              className={walletAddress ? "success-btn" : ""}
            >
              {walletAddress ? "Wallet Connected ✓" : "Connect Wallet"}
            </button>
            {walletAddress && (
              <p className="wallet-display">Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</p>
            )}
          </div>
          
          <div className="register-step">
            <h3>Step 2: Create Your Profile</h3>
            <form onSubmit={handleRegister}>
              <div className="form-control">
                <label htmlFor="username">Your Name:</label>
                <input
                  type="text"
                  id="username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={!walletAddress || loading}
                />
              </div>
              
              <div className="form-control">
                <label htmlFor="useremail">Email Address:</label>
                <input
                  type="email"
                  id="useremail"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={!walletAddress || loading}
                  className={emailError ? "error-input" : ""}
                />
                {emailError && <p className="form-error">{emailError}</p>}
              </div>
              
              <button 
                type="submit" 
                disabled={!walletAddress || !userName.trim() || !userEmail.trim() || loading}
                className="register-btn"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </div>

        {status && (
          <div className={`status-message ${status.includes('Error') ? 'error' : status.includes('success') ? 'success' : ''}`}>
            {status}
          </div>
        )}

        {loading && <div className="loader">Processing...</div>}
      </div>
    </div>
  );
}

export default Register;
