import React, { useState, useEffect } from 'react';
import { getAllBooks, borrowBook, returnBook } from '../utils/interact';

function User() {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBooks();
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

  const handleBorrowBook = async (id, price) => {
    setStatus(`Borrowing book... Please confirm in MetaMask.`);
    const result = await borrowBook(id, price);
    setStatus(result.status);
    
    if (result.success) {
      fetchBooks();
    }
  };

  const handleReturnBook = async (id) => {
    setStatus(`Returning book... Please confirm in MetaMask.`);
    const result = await returnBook(id);
    setStatus(result.status);
    
    if (result.success) {
      fetchBooks();
    }
  };

  return (
    <div className="user-panel">
      <h2>Available Books</h2>
      
      {loading ? <p>Loading books...</p> : (
        <div className="book-list">
          {books.length === 0 ? (
            <p>No books available in the library.</p>
          ) : (
            books.map((book) => (
              <div key={book.id} className="book-card">
                <h3>{book.title}</h3>
                <p><strong>Author:</strong> {book.author}</p>
                <p><strong>Borrow Price:</strong> {book.borrowPrice} ETH</p>
                <p><strong>Status:</strong> {book.available ? "Available" : "Borrowed"}</p>
                
                {book.available ? (
                  <button 
                    onClick={() => handleBorrowBook(book.id, book.borrowPrice)}
                    className="borrow-btn"
                  >
                    Borrow Book
                  </button>
                ) : (
                  <button 
                    onClick={() => handleReturnBook(book.id)}
                    className="return-btn"
                  >
                    Return Book
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {status && <p className="status-message">{status}</p>}
    </div>
  );
}

export default User;
