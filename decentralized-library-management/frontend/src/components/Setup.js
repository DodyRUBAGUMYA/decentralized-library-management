import React, { useState, useEffect } from 'react';
import { connectWallet, getConnectedAccounts, initializeSystem } from '../utils/interact';

function Setup({ onSetupComplete }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if any accounts are already connected
    checkConnectedAccounts();
  }, []);

  const checkConnectedAccounts = async () => {
    const response = await getConnectedAccounts();
    if (response.success && response.accounts.length > 0) {
      setAccounts(response.accounts);
      setWalletConnected(true);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    const walletResponse = await connectWallet();
    
    if (walletResponse.success) {
      setAccounts(walletResponse.accounts);
      setWalletConnected(true);
      // Don't automatically select an account - let user choose
    } else {
      setStatus(walletResponse.status);
    }
    
    setLoading(false);
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    // Save the selected account to localStorage
    localStorage.setItem('selectedAccount', account);
  };

  const handleInitialize = async () => {
    if (!selectedAccount) {
      setStatus("Please select an account to use as admin");
      return;
    }

    setLoading(true);
    setStatus("Initializing system with selected account... Please confirm in MetaMask");
    
    // Store which account should be used for the transaction
    localStorage.setItem('adminAccount', selectedAccount);
    
    // Show instructions to switch accounts in MetaMask if needed
    const currentAccount = window.ethereum.selectedAddress;
    if (currentAccount.toLowerCase() !== selectedAccount.toLowerCase()) {
      alert(`Please switch to account ${selectedAccount.substring(0, 6)}...${selectedAccount.substring(38)} in MetaMask before confirming the transaction.`);
    }
    
    const initResult = await initializeSystem(selectedAccount);
    setStatus(initResult.status);

    if (initResult.success) {
      setTimeout(() => {
        onSetupComplete();
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1>Welcome to Library DApp</h1>
        <p className="setup-intro">
          This appears to be the first time running this application.
          An administrator account needs to be set up.
        </p>
        
        <div className="setup-steps">
          <h2>Initial Setup</h2>
          <div className="setup-step">
            <h3>Step 1: Connect Your Wallet</h3>
            <p>The wallet you select will be the system administrator.</p>
            {!walletConnected ? (
              <button 
                onClick={handleConnectWallet} 
                disabled={loading}
                className="connect-button"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : (
              <div className="connection-status">
                <span className="success-indicator">✓</span> Wallet Connected
              </div>
            )}
          </div>
          
          {walletConnected && (
            <div className="setup-step">
              <h3>Step 2: Select Admin Account</h3>
              <p>Choose which account will be the system administrator:</p>
              
              <div className="account-selection-list">
                {accounts.map((account, index) => (
                  <div 
                    key={account}
                    className={`account-option ${selectedAccount === account ? 'selected' : ''}`}
                    onClick={() => handleAccountSelect(account)}
                  >
                    <div className="account-selector">
                      <input 
                        type="radio" 
                        name="adminAccount" 
                        checked={selectedAccount === account} 
                        onChange={() => handleAccountSelect(account)}
                        id={`account-${index}`}
                      />
                      <label htmlFor={`account-${index}`}>
                        Account {index+1}: {account.substring(0, 6)}...{account.substring(38)}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {walletConnected && selectedAccount && (
            <div className="setup-step">
              <h3>Step 3: Initialize System</h3>
              <p>Complete the setup by initializing the system. This account will be the only one able to add books and manage the library.</p>
              <button 
                onClick={handleInitialize} 
                disabled={loading || !selectedAccount}
                className="initialize-btn"
              >
                {loading ? "Processing..." : "Initialize as Administrator"}
              </button>
            </div>
          )}
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

export default Setup;
