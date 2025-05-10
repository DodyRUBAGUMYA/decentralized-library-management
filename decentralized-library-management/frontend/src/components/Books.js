import React, { useState, useEffect } from 'react';
import { getAllBooks, borrowBook, checkUserRegistered } from '../utils/interact';

function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, available, borrowed
  const [isRegistered, setIsRegistered] = useState(false);
  
  useEffect(() => {
    fetchBooks();
    checkRegistration();
  }, []);
  
  const fetchBooks = async () => {
    setLoading(true);
    const response = await getAllBooks();
    if (response.success) {
      setBooks(response.books);
    } else {
      setStatus(response.status);
    }
    setLoading(false);
  };
  
  const checkRegistration = async () => {
    const response = await checkUserRegistered();
    if (response.success) {
      setIsRegistered(response.isRegistered);
    }
  };
  
  const handleBorrowBook = async (id, price) => {
    if (!isRegistered) {
      setStatus('Please register an account first to borrow books');
      return;
    }
    
    setStatus(`Borrowing book... Please confirm the payment of ${price} ETH in MetaMask.`);
    const result = await borrowBook(id, price);
    setStatus(result.status);
    
    if (result.success) {
      fetchBooks(); // Refresh books after borrowing
    }
  };
  
  // Filter and search books
  const filteredBooks = books.filter(book => {
    // Apply search filter
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply availability filter
    if (filter === 'available') {
      return matchesSearch && book.available;
    } else if (filter === 'borrowed') {
      return matchesSearch && !book.available;
    } else {
      return matchesSearch;
    }
  });
  
  return (
    <div className="books-container">
      <h1>Library Books</h1>
      
      <div className="books-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Books
          </button>
          <button 
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            Available
          </button>
          <button 
            className={`filter-btn ${filter === 'borrowed' ? 'active' : ''}`}
            onClick={() => setFilter('borrowed')}
          >
            Borrowed
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-spinner">Loading books...</div>
      ) : (
        <>
          <div className="books-count">
            Showing {filteredBooks.length} of {books.length} books
          </div>
          
          <div className="books-grid">
            {filteredBooks.length === 0 ? (
              <div className="no-books-message">
                <p>No books match your search criteria.</p>
              </div>
            ) : (
              filteredBooks.map(book => (
                <div 
                  key={book.id} 
                  className={`book-card ${!book.available ? 'unavailable' : ''}`}
                >
                  <div className="book-header">
                    <h3>{book.title}</h3>
                    {!book.available && (
                      <span className="borrowed-badge">Borrowed</span>
                    )}
                  </div>
                  <div className="book-details">
                    <p className="book-author">by {book.author}</p>
                    <div className="book-price">
                      <span>{book.borrowPrice} ETH</span>
                      <small className="fee-info">Fee goes to library contract</small>
                    </div>
                  </div>
                  <div className="book-actions">
                    {book.available ? (
                      <button 
                        onClick={() => handleBorrowBook(book.id, book.borrowPrice)}
                        className="borrow-button"
                        disabled={!isRegistered}
                      >
                        Borrow Book
                      </button>
                    ) : (
                      <button className="unavailable-button" disabled>
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
      
      {status && (
        <div className={`status-message ${status.includes('Error') ? 'error' : status.includes('success') ? 'success' : ''}`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default Books;
