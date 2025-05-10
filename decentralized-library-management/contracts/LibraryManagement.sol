// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LibraryManagement
 * @dev A decentralized library management system where books can be borrowed and returned
 */
contract LibraryManagement {
    address public owner;
    bool public initialized = false;
    
    struct User {
        address userAddress;
        string name;
        string email; 
        bool isRegistered;
        uint256 registrationDate;
    }
    
    struct Book {
        uint256 id;
        string title;
        string author;
        uint256 borrowPrice;
        bool available;
    }
    
    mapping(uint256 => Book) public books;
    uint256 public bookCount;
    
    // User management
    mapping(address => User) public users;
    address[] public userAddresses;
    
    // Track borrowings
    mapping(uint256 => address) public borrowers;
    
    // Events
    event BookAdded(uint256 indexed id, string title, string author, uint256 borrowPrice);
    event BookBorrowed(uint256 indexed id, address borrower, uint256 amount);
    event BookReturned(uint256 indexed id, address borrower);
    event UserRegistered(address indexed userAddress, string name, string email);
    event SystemInitialized(address indexed owner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    /**
     * @dev Constructor sets the contract creator as the owner
     */
    constructor() {
        // Contract starts uninitialized
    }
    
    /**
     * @dev Initialize the contract and set the admin
     */
    function initialize() external {
        require(!initialized, "System is already initialized");
        owner = msg.sender;
        initialized = true;
        
        // Register the owner as the first user
        registerUser("Admin", "admin@example.com");
        
        emit SystemInitialized(msg.sender);
    }
    
    /**
     * @dev Modifier to restrict function access to only the owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the library owner can perform this action");
        _;
    }
    
    /**
     * @dev Register a new user with name and email
     * @param _name User's name
     * @param _email User's email address for contact
     */
    function registerUser(string memory _name, string memory _email) public {
        // Input validation
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        require(!users[msg.sender].isRegistered, "User already registered");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            name: _name,
            email: _email,
            isRegistered: true,
            registrationDate: block.timestamp
        });
        
        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender, _name, _email);
    }
    
    /**
     * @dev Modifier to restrict function access to only registered users
     */
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User is not registered");
        _;
    }
    
    /**
     * @dev Get user info by address
     * @param _userAddress The user's address
     * @return name User's name
     * @return email User's email
     * @return isRegistered User's registration status
     * @return registrationDate User's registration timestamp
     */
    function getUserInfo(address _userAddress) external view returns (string memory name, string memory email, bool isRegistered, uint256 registrationDate) {
        User memory user = users[_userAddress];
        require(user.isRegistered, "User not registered");
        return (user.name, user.email, user.isRegistered, user.registrationDate);
    }
    
    /**
     * @dev Add a new book to the library (admin only)
     * @param _title Book title
     * @param _author Book author
     * @param _borrowPrice Price in ETH to borrow the book
     */
    function addBook(string memory _title, string memory _author, uint256 _borrowPrice) external onlyOwner {
        // Input validation
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_author).length > 0, "Author cannot be empty");
        require(_borrowPrice > 0, "Borrow price must be greater than 0");
        
        bookCount++;
        books[bookCount] = Book(
            bookCount,
            _title,
            _author,
            _borrowPrice,
            true
        );
        
        emit BookAdded(bookCount, _title, _author, _borrowPrice);
    }
    
    /**
     * @dev Borrow a book by paying the borrow price
     * @param _id Book ID to borrow
     */
    function borrowBook(uint256 _id) external payable onlyRegistered {
        Book storage book = books[_id];
        require(book.id != 0, "Book does not exist");
        require(book.available, "Book is not available");
        require(msg.value >= book.borrowPrice, "Insufficient funds to borrow this book");
        
        book.available = false;
        borrowers[_id] = msg.sender;
        
        // Funds are automatically stored in the contract
        // No need to explicitly transfer them anywhere
        
        emit BookBorrowed(_id, msg.sender, msg.value);
    }
    
    /**
     * @dev Return a book (admin only)
     * @param _id Book ID to return
     */
    function returnBook(uint256 _id) external onlyOwner {
        Book storage book = books[_id];
        require(book.id != 0, "Book does not exist");
        require(!book.available, "Book is already available");
        
        address borrower = borrowers[_id];
        book.available = true;
        
        emit BookReturned(_id, borrower);
    }
    
    /**
     * @dev Get borrower of a specific book
     * @param _id Book ID
     * @return The address of the borrower
     */
    function getBookBorrower(uint256 _id) external view returns (address) {
        require(books[_id].id != 0, "Book does not exist");
        require(!books[_id].available, "Book is not borrowed");
        return borrowers[_id];
    }
    
    /**
     * @dev Get list of all borrowed books by current user
     * @return An array of borrowed books
     */
    function getBorrowedBooks() external view onlyRegistered returns (Book[] memory) {
        // First count the borrowed books by this user
        uint256 count = 0;
        for (uint256 i = 1; i <= bookCount; i++) {
            if (!books[i].available && borrowers[i] == msg.sender) {
                count++;
            }
        }
        
        // Create an array with the correct size
        Book[] memory borrowedBooks = new Book[](count);
        
        // Fill the array
        uint256 index = 0;
        for (uint256 i = 1; i <= bookCount; i++) {
            if (!books[i].available && borrowers[i] == msg.sender) {
                borrowedBooks[index] = books[i];
                index++;
            }
        }
        
        return borrowedBooks;
    }
    
    /**
     * @dev Get details of a specific book
     * @param _id Book ID
     * @return id Book ID
     * @return title Book title
     * @return author Book author
     * @return borrowPrice Book borrow price in ETH
     * @return available Book availability status
     */
    function getBook(uint256 _id) external view returns (uint256, string memory, string memory, uint256, bool) {
        Book memory book = books[_id];
        require(book.id != 0, "Book does not exist");
        return (book.id, book.title, book.author, book.borrowPrice, book.available);
    }
    
    /**
     * @dev Get all books in the library
     * @return An array of all books
     */
    function getAllBooks() external view returns (Book[] memory) {
        Book[] memory allBooks = new Book[](bookCount);
        for (uint256 i = 1; i <= bookCount; i++) {
            allBooks[i-1] = books[i];
        }
        return allBooks;
    }
    
    /**
     * @dev Get library's ETH balance (admin only)
     * Note: This will usually return 0 as funds go directly to owner
     * @return The library's balance in wei
     */
    function getLibraryBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Withdraw funds to owner's address (admin only)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        // Send all contract funds to owner
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Failed to withdraw funds");
    }
    
    /**
     * @dev Check if a user is registered
     * @param _address User's address
     * @return Registration status
     */
    function isUserRegistered(address _address) external view returns (bool) {
        return users[_address].isRegistered;
    }
    
    /**
     * @dev Get list of all registered users (admin only)
     * @return Array of user addresses
     */
    function getRegisteredUsers() external view onlyOwner returns (address[] memory) {
        return userAddresses;
    }

    /**
     * @dev Transfer ownership to a new address
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
