const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LibraryManagement Contract", function () {
  let LibraryManagement;
  let library;
  let owner;
  let user1;
  let user2;
  let addrs;

  beforeEach(async function () {
    // Get contract factory and signers
    LibraryManagement = await ethers.getContractFactory("LibraryManagement");
    [owner, user1, user2, ...addrs] = await ethers.getSigners();

    // Deploy contract
    library = await LibraryManagement.deploy();
    await library.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await library.owner()).to.equal(owner.address);
    });

    it("Should start with zero books", async function () {
      expect(await library.bookCount()).to.equal(0);
    });
  });

  describe("Book Management", function () {
    it("Should allow owner to add a book", async function () {
      const addTx = await library.addBook("The Hobbit", "J.R.R. Tolkien", ethers.utils.parseEther("0.1"));
      await addTx.wait();
      
      expect(await library.bookCount()).to.equal(1);
      
      // Check the book details
      const book = await library.books(1);
      expect(book.title).to.equal("The Hobbit");
      expect(book.author).to.equal("J.R.R. Tolkien");
      expect(book.borrowPrice).to.equal(ethers.utils.parseEther("0.1"));
      expect(book.available).to.be.true;
    });
    
    it("Should not allow non-owners to add books", async function () {
      await expect(
        library.connect(user1).addBook("The Hobbit", "J.R.R. Tolkien", ethers.utils.parseEther("0.1"))
      ).to.be.revertedWith("Only the library owner can perform this action");
    });
    
    it("Should allow registered users to borrow books", async function () {
      // Add a book
      await library.addBook("The Hobbit", "J.R.R. Tolkien", ethers.utils.parseEther("0.1"));
      
      // Register user
      await library.connect(user1).registerUser("John Doe", "john@example.com");
      
      // Borrow the book
      await library.connect(user1).borrowBook(1, { value: ethers.utils.parseEther("0.1") });
      
      // Check if book is now unavailable
      const book = await library.books(1);
      expect(book.available).to.be.false;
      
      // Check if correct borrower is recorded
      expect(await library.borrowers(1)).to.equal(user1.address);
    });
    
    it("Should not allow borrowing unavailable books", async function () {
      // Add a book
      await library.addBook("The Hobbit", "J.R.R. Tolkien", ethers.utils.parseEther("0.1"));
      
      // Register users
      await library.connect(user1).registerUser("John Doe", "john@example.com");
      await library.connect(user2).registerUser("Jane Smith", "jane@example.com");
      
      // First user borrows the book
      await library.connect(user1).borrowBook(1, { value: ethers.utils.parseEther("0.1") });
      
      // Second user tries to borrow the same book
      await expect(
        library.connect(user2).borrowBook(1, { value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Book is not available");
    });
    
    it("Should only allow admin to return books", async function () {
      // Add a book
      await library.addBook("The Hobbit", "J.R.R. Tolkien", ethers.utils.parseEther("0.1"));
      
      // Register user
      await library.connect(user1).registerUser("John Doe", "john@example.com");
      
      // Borrow the book
      await library.connect(user1).borrowBook(1, { value: ethers.utils.parseEther("0.1") });
      
      // Non-admin tries to return the book - should fail
      await expect(
        library.connect(user1).returnBook(1)
      ).to.be.revertedWith("Only the library owner can perform this action");
      
      // Admin returns the book
      await library.connect(owner).returnBook(1);
      
      // Check if book is available again
      const book = await library.books(1);
      expect(book.available).to.be.true;
    });
    
    it("Should require sufficient funds to borrow a book", async function () {
      // Add a book
      await library.addBook("The Hobbit", "J.R.R. Tolkien", ethers.utils.parseEther("0.1"));
      
      // Register user
      await library.connect(user1).registerUser("John Doe", "john@example.com");
      
      // Try to borrow with insufficient funds
      await expect(
        library.connect(user1).borrowBook(1, { value: ethers.utils.parseEther("0.05") })
      ).to.be.revertedWith("Insufficient funds to borrow this book");
    });
  });
  
  describe("Financial Operations", function () {
    it("Should allow owner to withdraw funds", async function () {
      // Add a book
      await library.addBook("The Hobbit", "J.R.R. Tolkien", ethers.utils.parseEther("0.1"));
      
      // Register user
      await library.connect(user1).registerUser("John Doe", "john@example.com");
      
      // User borrows book, sending 0.1 ETH
      await library.connect(user1).borrowBook(1, { value: ethers.utils.parseEther("0.1") });
      
      // Check contract balance
      expect(await ethers.provider.getBalance(library.address)).to.equal(ethers.utils.parseEther("0.1"));
      
      // Get owner's balance before withdrawal
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      // Owner withdraws funds
      const tx = await library.connect(owner).withdrawFunds();
      const receipt = await tx.wait();
      
      // Calculate gas cost
      const gasUsed = receipt.gasUsed;
      const gasPrice = tx.gasPrice;
      const gasCost = gasUsed.mul(gasPrice);
      
      // Check owner's balance increased (minus gas cost)
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.equal(
        initialBalance.add(ethers.utils.parseEther("0.1")).sub(gasCost)
      );
      
      // Check contract balance is zero
      expect(await ethers.provider.getBalance(library.address)).to.equal(0);
    });
    
    it("Should not allow non-owners to withdraw funds", async function () {
      // Add a book
      await library.addBook("The Hobbit", "J.R.R. Tolkien", ethers.utils.parseEther("0.1"));
      
      // Register user
      await library.connect(user1).registerUser("John Doe", "john@example.com");
      
      // User borrows book, sending 0.1 ETH
      await library.connect(user1).borrowBook(1, { value: ethers.utils.parseEther("0.1") });
      
      // User tries to withdraw funds
      await expect(
        library.connect(user1).withdrawFunds()
      ).to.be.revertedWith("Only the library owner can perform this action");
    });
  });
  
  describe("User Management", function () {
    it("Should allow users to register", async function () {
      // User registers
      await library.connect(user1).registerUser("John Doe", "john@example.com");
      
      // Check if user is registered
      const userInfo = await library.getUserInfo(user1.address);
      expect(userInfo.name).to.equal("John Doe");
      expect(userInfo.email).to.equal("john@example.com");
      expect(userInfo.isRegistered).to.be.true;
    });
    
    it("Should not allow duplicate registrations", async function () {
      // User registers
      await library.connect(user1).registerUser("John Doe", "john@example.com");
      
      // User tries to register again
      await expect(
        library.connect(user1).registerUser("John Smith", "john@example.com")
      ).to.be.revertedWith("User already registered");
    });
  });
});
