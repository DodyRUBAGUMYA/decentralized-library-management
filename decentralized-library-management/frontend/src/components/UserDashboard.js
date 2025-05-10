import React, { useState, useEffect } from 'react';
import { getUserInfo, getBorrowedBooks } from '../utils/interact';

function UserDashboard() {
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    registrationDate: ''
  });
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  
  useEffect(() => {
    fetchUserInfo();
    fetchBorrowedBooks();
  }, []);
  
  const fetchUserInfo = async () => {
    const result = await getUserInfo();
    if (result.success) {
      setUserInfo({
        name: result.name,
        email: result.email,
        registrationDate: result.registrationDate
      });
    } else {
      setStatus(`Error fetching user info: ${result.status}`);
    }
    setLoading(false);
  };
  
  const fetchBorrowedBooks = async () => {
    const result = await getBorrowedBooks();
    if (result.success) {
      setBorrowedBooks(result.books);
    } else {
      setStatus(`Error fetching borrowed books: ${result.status}`);
    }
  };
  
  if (loading) {
    return <div className="dashboard-container"><div className="loading-spinner">Loading...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">My Dashboard</h1>
      
      <div className="dashboard-content">
        <div className="user-profile-section">
          <h2>My Profile</h2>
          <div className="profile-card">
            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <p>{userInfo.name}</p>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <p>{userInfo.email}</p>
              </div>
              <div className="info-group">
                <label>Member Since:</label>
                <p>{userInfo.registrationDate}</p>
              </div>
            </div>
            <button className="secondary-button">Edit Profile</button>
          </div>
        </div>
        
        <div className="borrowed-books-section">
          <h2>My Borrowed Books</h2>
          {borrowedBooks.length === 0 ? (
            <div className="no-books-message">
              <p>You haven't borrowed any books yet.</p>
              <button className="primary-button" onClick={() => window.location.href = '/books'}>
                Browse Books
              </button>
            </div>
          ) : (
            <>
              <div className="borrowed-books-info">
                <p className="info-note">
                  <strong>Note:</strong> Once you're done with a book, please contact the librarian 
                  to return it. Only library staff can process returns.
                </p>
              </div>
              <div className="borrowed-books-list">
                {borrowedBooks.map(book => (
                  <div key={book.id} className="book-card">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">by {book.author}</p>
                    <p className="borrow-price">Deposit: {book.borrowPrice} ETH</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {status && (
        <div className={`status-message ${status.includes('Error') ? 'error' : status.includes('success') ? 'success' : ''}`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
