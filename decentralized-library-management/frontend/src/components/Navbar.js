import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { connectWallet, getConnectedAccounts, isLibraryOwner, switchAccount } from '../utils/interact';

function Navbar({ userName, onLogout, userAddress }) {
  const [accounts, setAccounts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountsDropdownOpen, setAccountsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkWalletConnected();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (userAddress) {
      checkAdminStatus();
    }
  }, [userAddress]);

  const checkWalletConnected = async () => {
    const accountsResponse = await getConnectedAccounts();
    if (accountsResponse.success && accountsResponse.accounts.length > 0) {
      setAccounts(accountsResponse.accounts);
    }
  };

  const handleAccountsChanged = async (newAccounts) => {
    if (newAccounts.length > 0) {
      setAccounts(newAccounts);
      checkAdminStatus();
      // Account changed - we'll let App.js handle the state update
      window.location.reload();
    } else {
      setAccounts([]);
      setIsAdmin(false);
    }
  };

  const connectWalletPressed = async () => {
    setLoading(true);
    const walletResponse = await connectWallet();
    if (walletResponse.success) {
      setAccounts(walletResponse.accounts);
      // After successful connection, reload page to ensure all state is updated
      window.location.reload();
    } else {
      alert(`Failed to connect wallet: ${walletResponse.status}`);
    }
    setLoading(false);
  };

  const checkAdminStatus = async () => {
    const adminResponse = await isLibraryOwner();
    setIsAdmin(adminResponse.success && adminResponse.isOwner);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    if (onLogout) onLogout();
  };

  const handleAccountSwitch = async (account) => {
    setAccountsDropdownOpen(false);
    setDropdownOpen(false);
    
    // Attempt to explicitly switch to the selected account
    setLoading(true);
    await switchAccount(account);
    setLoading(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Library DApp</Link>
      </div>
      
      <div className="navbar-menu">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        {isAdmin && (
          <Link to="/admin-dashboard" className={location.pathname === '/admin-dashboard' ? 'active' : ''}>
            Admin Dashboard
          </Link>
        )}
        {userAddress && (
          <Link to="/user-dashboard" className={location.pathname === '/user-dashboard' ? 'active' : ''}>
            My Dashboard
          </Link>
        )}
        <Link to="/books" className={location.pathname === '/books' ? 'active' : ''}>Books</Link>
      </div>
      
      <div className="user-wallet-info">
        {userAddress ? (
          <div className="user-account">
            {userName && <span className="user-greeting">Hello, {userName}</span>}
            
            <div className="wallet-dropdown">
              <button 
                className="wallet-button" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={loading}
              >
                {`${userAddress.substring(0, 6)}...${userAddress.substring(38)}`}
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {dropdownOpen && (
                <div className="dropdown-content">
                  {accounts.length > 1 && (
                    <div className="dropdown-item accounts-item">
                      <div onClick={() => setAccountsDropdownOpen(!accountsDropdownOpen)} className="accounts-toggle">
                        Switch Account <span className="dropdown-arrow">{accountsDropdownOpen ? '▲' : '▼'}</span>
                      </div>
                      
                      {accountsDropdownOpen && (
                        <div className="accounts-list">
                          {accounts.map((account, index) => (
                            <div 
                              key={account} 
                              className={`account-item ${account === userAddress ? 'active' : ''}`}
                              onClick={() => handleAccountSwitch(account)}
                            >
                              {`Account ${index+1}: ${account.substring(0, 6)}...${account.substring(38)}`}
                              {account === userAddress && <span className="current-indicator"> (current)</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="dropdown-item logout-item" onClick={handleLogout}>
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={connectWalletPressed} 
            className="connect-button"
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
