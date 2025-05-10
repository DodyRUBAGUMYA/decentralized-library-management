import React, { useState, useEffect } from 'react';
import { addBook, getLibraryBalance, withdrawFunds, isLibraryOwner, getAllBooks, returnBook, getBookBorrower } from '../utils/interact';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [borrowPrice, setBorrowPrice] = useState("");
  const [status, setStatus] = useState("");
  const [balance, setBalance] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('add-book');
  const [borrowers, setBorrowers] = useState({});
  const [returningBook, setReturningBook] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    checkOwnerStatus();
    fetchBalance();
    fetchBooks();
    
    // Listen for account changes in MetaMask
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
      // Re-check if the new account is an admin
      const adminCheck = await isLibraryOwner();
      setIsOwner(adminCheck.success && adminCheck.isOwner);
      
      // If switched to non-admin account, show warning and redirect after delay
      if (!adminCheck.isOwner) {
        setStatus("Warning: You've switched to a non-admin account. Redirecting to home page...");
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        // Refresh admin data if still admin
        fetchBalance();
        fetchBooks();
      }
    }
  };
  
  const checkOwnerStatus = async () => {
    const response = await isLibraryOwner();
    if (response.success) {
      setIsOwner(response.isOwner);
      
      // If not admin, show message and redirect
      if (!response.isOwner) {
        setStatus("Error: You are not the library owner. Redirecting to home page...");
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
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
  
  const fetchBorrowerInfo = async (bookId) => {
    try {
      const result = await getBookBorrower(bookId);
      if (result.success) {
        setBorrowers(prev => ({
          ...prev,
          [bookId]: result.borrower
        }));
      }
    } catch (error) {
      console.error("Failed to fetch borrower:", error);
    }
  };

  const fetchBooks = async () => {
    const response = await getAllBooks();
    if (response.success) {
      setBooks(response.books);
      response.books.forEach(book => {
        if (!book.available) {
          fetchBorrowerInfo(book.id);
        }
      });
    } else {
      setStatus("Failed to fetch books: " + response.status);
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
      fetchBooks(); // Refresh the book list
    }
  };

  const handleWithdraw = async () => {
    if (!isOwner) {
      setStatus("Error: Only the library owner can withdraw funds");
      return;
    }
    
    try {
      setStatus("Withdrawing funds... Please wait.");
      setLoading(true);
      const result = await withdrawFunds();
      
      if (result.success) {
        setStatus(`Success! Funds have been withdrawn to your wallet: ${result.status}`);
        fetchBalance(); // Refresh the balance after withdrawal
      } else {
        setStatus(`Error withdrawing funds: ${result.status}`);
      }
    } catch (error) {
      setStatus(`Unexpected error during withdrawal: ${error.message}`);
      console.error("Withdrawal error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (id) => {
    if (!isOwner) {
      setStatus("Error: Only the library owner can return books");
      return;
    }
    
    setReturningBook(id);
    setStatus("Processing return... Please wait.");
    const result = await returnBook(id);
    setStatus(result.status);
    
    if (result.success) {
      fetchBooks(); // Refresh the book list
    }
    setReturningBook(null);
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading-spinner">Loading...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Admin Dashboard</h1>
      
      {!isOwner && (
        <div className="owner-warning">
          <p>⚠️ Warning: You are not the library owner. Admin functions are restricted.</p>
          <p>Connect with the owner account to perform admin actions.</p>
        </div>
      )}
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'add-book' ? 'active' : ''}`} 
          onClick={() => setActiveTab('add-book')}
        >
          Add Book
        </button>
        <button 
          className={`tab-button ${activeTab === 'finances' ? 'active' : ''}`} 
          onClick={() => setActiveTab('finances')}
        >
          Finances
        </button>
        <button 
          className={`tab-button ${activeTab === 'manage-books' ? 'active' : ''}`} 
          onClick={() => setActiveTab('manage-books')}
        >
          Manage Books
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'add-book' && (
          <div className="add-book-form">
            <h2>Add New Book</h2>
            <form onSubmit={handleAddBook}>
              <div className="form-control">
                <label>Title:</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter book title"
                  disabled={!isOwner}
                />
              </div>
              
              <div className="form-control">
                <label>Author:</label>
                <input 
                  type="text" 
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter book author"
                  disabled={!isOwner}
                />
              </div>
              
              <div className="form-control">
                <label>Borrow Price (ETH):</label>
                <input 
                  type="text" 
                  value={borrowPrice}
                  onChange={(e) => setBorrowPrice(e.target.value)}
                  placeholder="Enter borrow price in ETH"
                  disabled={!isOwner}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={!isOwner}
                className={isOwner ? "primary-button" : "disabled-btn"}
              >
                Add Book
              </button>
            </form>
          </div>
        )}
        
        {activeTab === 'finances' && (
          <div className="finances-section">
            <h2>Library Finances</h2>
            
            <div className="withdrawal-section">
              <h3>Withdraw Collected Fees</h3>
              <p>As admin, you can withdraw all borrowing fees collected in the library contract.</p>
              
              <div className="balance-card">
                <div className="balance-label">Collected Fees Available for Withdrawal:</div>
                <div className="balance-amount">{balance} ETH</div>
                
                <button 
                  onClick={handleWithdraw} 
                  disabled={!isOwner || parseFloat(balance) <= 0 || loading}
                  className={isOwner && parseFloat(balance) > 0 ? "primary-button withdraw-button" : "disabled-btn"}
                >
                  {loading ? "Processing..." : `Withdraw ${balance} ETH to Admin Wallet`}
                </button>
                
                {parseFloat(balance) <= 0 && (
                  <div className="info-message">
                    <p>There are currently no fees to withdraw. Fees will accumulate here when users borrow books.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="balance-info-card">
              <div className="info-header">Fee Collection System</div>
              <div className="info-content">
                <p>When users borrow books, their fees are collected in the library contract.</p>
                <p>You can withdraw all collected fees at any time using the button above.</p>
                <p>The contract balance shows the total amount of fees available for withdrawal.</p>
              </div>
            </div>
            
            <div className="transaction-history">
              <h3>Transaction History</h3>
              <p className="muted-text">
                Check your MetaMask wallet for a record of all withdrawal transactions.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'manage-books' && (
          <div className="manage-books-section">
            <h2>Manage Library Books</h2>
            <div className="books-stats">
              <div className="stat-card">
                <div className="stat-title">Total Books</div>
                <div className="stat-value">{books.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Available Books</div>
                <div className="stat-value">{books.filter(book => book.available).length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Borrowed Books</div>
                <div className="stat-value">{books.filter(book => !book.available).length}</div>
              </div>
            </div>
            
            <div className="book-management-list">
              <h3>Book Inventory</h3>
              <table className="books-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Price (ETH)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-books-message">No books found in the library.</td>
                    </tr>
                  ) : (
                    books.map(book => (
                      <tr key={book.id} className={book.available ? '' : 'borrowed'}>
                        <td>{book.id}</td>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.borrowPrice}</td>
                        <td>
                          <span className={`status-badge ${book.available ? 'available' : 'borrowed'}`}>
                            {book.available ? 'Available' : 'Borrowed'}
                          </span>
                        </td>
                        <td>
                          {isOwner && !book.available && (
                            <button 
                              className="return-button"
                              onClick={() => handleReturnBook(book.id)}
                              disabled={returningBook === book.id}
                            >
                              {returningBook === book.id ? 'Processing...' : 'Return Book'}
                            </button>
                          )}
                          {!book.available && borrowers[book.id] && (
                            <div className="borrower-info">
                              <small>
                                Borrower: {borrowers[book.id].substring(0, 6)}...{borrowers[book.id].substring(38)}
                              </small>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {status && <p className={`status-message ${status.includes('Error') ? 'error' : ''}`}>{status}</p>}
    </div>
  );
}

export default AdminDashboard;
