import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Books from './components/Books';
import Setup from './components/Setup';
import Register from './components/Register';
import Home from './components/Home';
import { 
  checkSystemInitialized, 
  checkUserRegistered,
  getUserInfo,
  connectWallet,
  disconnectWallet
} from './utils/interact';
import './App.css';

function App() {
  const [systemReady, setSystemReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInitialization();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
      }
    };
  }, []);

  const handleAccountChange = async (accounts) => {
    if (accounts.length > 0) {
      setUserAddress(accounts[0]);
      checkUserStatus(accounts[0]);
    } else {
      setUserAddress("");
      setIsRegistered(false);
      setUserName("");
      setUserEmail("");
    }
  };

  const checkInitialization = async () => {
    setLoading(true);
    
    // Try to get the current connected account
    const walletResponse = await connectWallet();
    if (walletResponse.success) {
      setUserAddress(walletResponse.address);
    }
    
    // Check if system is initialized
    const initResponse = await checkSystemInitialized();
    if (initResponse.success) {
      setIsInitialized(initResponse.initialized);
      
      // If system is initialized, check if the current user is registered
      if (initResponse.initialized && walletResponse.success) {
        await checkUserStatus(walletResponse.address);
      }
    }
    
    setSystemReady(true);
    setLoading(false);
  };
  
  const checkUserStatus = async (address) => {
    const regResponse = await checkUserRegistered(address);
    if (regResponse.success && regResponse.isRegistered) {
      setIsRegistered(true);
      // Get user info including email
      const userInfoResponse = await getUserInfo(address);
      if (userInfoResponse.success) {
        setUserName(userInfoResponse.name);
        setUserEmail(userInfoResponse.email);
      }
    } else {
      setIsRegistered(false);
    }
  };

  const handleSetupComplete = () => {
    setIsInitialized(true);
    setIsRegistered(true);
    checkInitialization(); // Refresh all state
  };
  
  const handleRegisterComplete = () => {
    setIsRegistered(true);
    checkUserStatus(userAddress); // Get user details
  };
  
  const handleLogout = async () => {
    const result = await disconnectWallet();
    if (result.success) {
      setUserAddress("");
      setIsRegistered(false);
      setUserName("");
      localStorage.removeItem('walletConnected'); // Clear persistent connection
      
      // Force reload page to ensure MetaMask state is reset
      window.location.reload();
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading application...</div>;
  }

  // System not initialized - show setup
  if (!isInitialized) {
    return <Setup onSetupComplete={handleSetupComplete} />;
  }

  // User not registered - show registration
  if (!isRegistered && userAddress) {
    return <Register onRegisterComplete={handleRegisterComplete} />;
  }

  return (
    <Router>
      <div className="App">
        <Navbar 
          userName={userName} 
          onLogout={handleLogout}
          userAddress={userAddress}
        />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/books" element={<Books />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
