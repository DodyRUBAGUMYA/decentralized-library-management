import React, { useState, useEffect } from 'react';
import { addBook, getLibraryBalance, withdrawFunds, isLibraryOwner, transferOwnership } from '../utils/interact';

function Admin() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [borrowPrice, setBorrowPrice] = useState("");
  const [status, setStatus] = useState("");
  const [balance, setBalance] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);

  useEffect(() => {
    checkOwnerStatus();
    fetchBalance();
  }, []);

  const checkOwnerStatus = async () => {
    const response = await isLibraryOwner();
    if (response.success) {
      setIsOwner(response.isOwner);
    }
    setLoading(false);
  };

  const fetchBalance = async () => {
    const response = await getLibraryBalance();
    if (response.success) {
      setBalance(response.balance);
    } else {
      setStatus("Failed to fetch library balance: " + response.status);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!title || !author || !borrowPrice) {
      setStatus("Please fill all fields");
      return;
    }

    if (!isOwner) {
      setStatus("Error: Only the library owner can add books");
      return;
    }

    setStatus("Adding book... Please wait.");
    const result = await addBook(title, author, borrowPrice);
    setStatus(result.status);
    
    if (result.success) {
      setTitle("");
      setAuthor("");
      setBorrowPrice("");
    }
  };

  const handleWithdraw = async () => {
    if (!isOwner) {
      setStatus("Error: Only the library owner can withdraw funds");
      return;
    }
    
    setStatus("Withdrawing funds... Please wait.");
    const result = await withdrawFunds();
    setStatus(result.status);
    
    if (result.success) {
      fetchBalance();
    }
  };

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!newOwnerAddress) {
      setStatus("Please enter a valid address");
      return;
    }

    if (!isOwner) {
      setStatus("Error: Only the library owner can transfer ownership");
      return;
    }

    setStatus("Transferring ownership... Please wait.");
    const result = await transferOwnership(newOwnerAddress);
    setStatus(result.status);
    
    if (result.success) {
      setNewOwnerAddress("");
      checkOwnerStatus(); // Re-check owner status after transfer
    }
  };

  if (loading) {
    return <div className="admin-panel"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      
      {!isOwner && (
        <div className="owner-warning">
          <p>⚠️ Warning: You are not the library owner. Admin functions are restricted.</p>
          <p>Connect with the owner account to perform admin actions.</p>
        </div>
      )}
      
      <div className="library-balance">
        <h3>Library Balance</h3>
        <p>{balance} ETH</p>
        <button 
          onClick={handleWithdraw} 
          disabled={!isOwner}
          className={isOwner ? "" : "disabled-btn"}
        >
          Withdraw Funds
        </button>
      </div>
      
      {isOwner && (
        <div className="admin-controls">
          <button 
            onClick={() => setShowTransferOwnership(!showTransferOwnership)}
            className="secondary-btn"
          >
            {showTransferOwnership ? "Hide Transfer Ownership" : "Transfer Ownership"}
          </button>
          
          {showTransferOwnership && (
            <div className="transfer-ownership-form">
              <h3>Transfer Ownership</h3>
              <p className="warning-text">Warning: This will permanently transfer admin control to another address.</p>
              <form onSubmit={handleTransferOwnership}>
                <div className="form-control">
                  <label>New Owner Address:</label>
                  <input 
                    type="text" 
                    value={newOwnerAddress}
                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                    placeholder="Enter address (0x...)"
                  />
                </div>
                <button 
                  type="submit"
                  className="danger-btn"
                >
                  Transfer Ownership
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      
      <div className="add-book-form">
        <h3>Add New Book</h3>
        <form onSubmit={handleAddBook}>
          <div className="form-control">
            <label>Title:</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
            />
          </div>
          
          <div className="form-control">
            <label>Author:</label>
            <input 
              type="text" 
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter book author"
            />
          </div>
          
          <div className="form-control">
            <label>Borrow Price (ETH):</label>
            <input 
              type="text" 
              value={borrowPrice}
              onChange={(e) => setBorrowPrice(e.target.value)}
              placeholder="Enter borrow price in ETH"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={!isOwner}
            className={isOwner ? "" : "disabled-btn"}
          >
            Add Book
          </button>
        </form>
      </div>
      
      {status && <p className={`status-message ${status.includes('Error') ? 'error' : ''}`}>{status}</p>}
    </div>
  );
}

export default Admin;
