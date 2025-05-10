import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Blockchain Library Management System</h1>
        <p className="hero-text">A decentralized way to manage and borrow books using Ethereum blockchain technology.</p>
        <div className="hero-buttons">
          <Link to="/books" className="primary-button">Browse Books</Link>
          <Link to="/user-dashboard" className="secondary-button">My Dashboard</Link>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Decentralized Library</h3>
            <p>All book records and transactions are stored on the Ethereum blockchain for transparency and security.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Borrowing</h3>
            <p>Use your Ethereum wallet to borrow books, with all transactions verified on the blockchain.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Fair Pricing</h3>
            <p>Each book has a transparent borrowing price, paid directly through smart contracts.</p>
          </div>
        </div>
      </div>
      
      <div className="instructions">
        <h2>How to Use</h2>
        
        <div className="instructions-grid">
          <div className="instructions-card">
            <h3>For Admins:</h3>
            <ol>
              <li>Connect your MetaMask wallet (must be the owner account)</li>
              <li>Go to the Admin Dashboard to manage books and library</li>
              <li>Add new books with titles, authors, and borrowing prices</li>
              <li>Monitor borrowed books and collect fees</li>
              <li>Withdraw funds to your wallet when needed</li>
            </ol>
          </div>
          
          <div className="instructions-card">
            <h3>For Users:</h3>
            <ol>
              <li>Connect your MetaMask wallet and register with your email</li>
              <li>Browse the available books in the library</li>
              <li>Borrow books by paying the listed price</li>
              <li>Return books when you're done using them</li>
              <li>Manage your borrowed books in your dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
