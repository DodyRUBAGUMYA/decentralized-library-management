import { ethers } from 'ethers';
import LibraryManagementArtifact from '../artifacts/contracts/LibraryManagement.sol/LibraryManagement.json';
import contractAddress from '../contractAddress.json';

/**
 * Connect to MetaMask wallet
 * @returns {Promise<Object>} Object containing success status, address, and accounts
 */
export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return {
        success: true,
        address: accounts[0],
        accounts: accounts,
        status: "Connected"
      };
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return {
        success: false,
        address: "",
        accounts: [],
        status: `Error: ${error.message}`
      };
    }
  } else {
    return {
      success: false,
      address: "",
      accounts: [],
      status: "MetaMask is not installed. Please install MetaMask to use this application."
    };
  }
};

/**
 * Disconnect wallet - includes guidance for complete disconnection
 * @returns {Promise<Object>} Success status and guidance
 */
export const disconnectWallet = async () => {
  try {
    // Clear stored connection state
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('selectedAccount');
    
    // Show instructions for full disconnection
    const message = `To completely disconnect from MetaMask:
1. Open MetaMask extension
2. Click the three dots in the top-right
3. Select "Connected sites"
4. Find this website and click the trash icon

Would you like to open MetaMask now?`;

    if (window.confirm(message)) {
      // This will trigger MetaMask to open
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    }
    
    return {
      success: true,
      status: "Application state cleared. Follow instructions to fully disconnect MetaMask."
    };
  } catch (error) {
    console.error("Error during disconnection:", error);
    return {
      success: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Explicitly request switching to a specific account
 * @param {string} accountAddress - The account address to switch to
 * @returns {Promise<Object>} Success status and account
 */
export const switchAccount = async (accountAddress) => {
  if (window.ethereum) {
    try {
      // First ensure we're on the right chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }], // 0x539 = 1337 in hex (Hardhat's chainId)
      });
      
      // Request access to the account specifically
      await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      // Note: Due to MetaMask security restrictions, we can't programmatically
      // switch to a specific account, but we can guide the user
      
      // Display clear instructions to the user
      const displayAddress = `${accountAddress.substring(0, 6)}...${accountAddress.substring(38)}`;
      alert(`Please manually select the account ${displayAddress} in your MetaMask wallet.`);
      
      // Trigger a refresh after a short delay to detect the change
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return {
        success: true,
        status: "Account switch requested"
      };
    } catch (error) {
      console.error("Error switching account:", error);
      return {
        success: false,
        status: `Error: ${error.message}`
      };
    }
  } else {
    return {
      success: false,
      status: "MetaMask is not installed"
    };
  }
};

/**
 * Get all connected accounts from MetaMask
 * @returns {Promise<Object>} Object containing success status and accounts array
 */
export const getConnectedAccounts = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return {
        success: true,
        accounts: accounts
      };
    } catch (error) {
      console.error("Failed to get accounts:", error);
      return {
        success: false,
        accounts: [],
        status: `Error: ${error.message}`
      };
    }
  } else {
    return {
      success: false,
      accounts: [],
      status: "MetaMask is not installed"
    };
  }
};

/**
 * Get contract instance with current signer
 * @param {string|null} specificAddress - Specific address to use as signer (optional)
 * @returns {ethers.Contract} Contract instance
 */
const getContract = (specificAddress = null) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let signer;
    
    if (specificAddress) {
      signer = provider.getSigner(specificAddress);
    } else {
      signer = provider.getSigner();
    }
    
    return new ethers.Contract(
      contractAddress.address,
      LibraryManagementArtifact.abi,
      signer
    );
  } catch (error) {
    console.error("Failed to get contract instance:", error);
    throw error;
  }
};

/**
 * System initialization
 * @returns {Promise<Object>} Object containing success status and initialization state
 */
export const checkSystemInitialized = async () => {
  try {
    const contract = getContract();
    const initialized = await contract.initialized();
    return {
      success: true,
      initialized
    };
  } catch (error) {
    return {
      success: false,
      initialized: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Initialize the system with specified admin account
 * @param {string} adminAccount - Optional specific account to use as admin
 * @returns {Promise<Object>} Success status
 */
export const initializeSystem = async (adminAccount = null) => {
  try {
    const contract = getContract();
    
    // If a specific admin account was selected but is not the current one
    if (adminAccount && window.ethereum.selectedAddress.toLowerCase() !== adminAccount.toLowerCase()) {
      // We can't force the account switch, but we can guide the user
      console.warn(`Current active account (${window.ethereum.selectedAddress}) does not match selected admin (${adminAccount})`);
    }
    
    const tx = await contract.initialize();
    await tx.wait();
    
    // Save the admin account
    if (adminAccount) {
      localStorage.setItem('adminAccount', adminAccount);
    }
    
    return {
      success: true,
      status: "System initialized successfully! You are now the admin."
    };
  } catch (error) {
    console.error("System initialization failed:", error);
    return {
      success: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Register a new user
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @returns {Promise<Object>} Object containing success status and status message
 */
export const registerUser = async (name, email) => {
  try {
    const contract = getContract();
    const tx = await contract.registerUser(name, email);
    await tx.wait();
    return {
      success: true,
      status: `User registered successfully as "${name}"`
    };
  } catch (error) {
    return {
      success: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Check if a user is registered
 * @param {string} address - User's Ethereum address (optional)
 * @returns {Promise<Object>} Object containing success status and registration state
 */
export const checkUserRegistered = async (address) => {
  try {
    const contract = getContract();
    const user = await contract.users(address || await getCurrentUserAddress());
    return {
      success: true,
      isRegistered: user.isRegistered
    };
  } catch (error) {
    return {
      success: false,
      isRegistered: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Get user information
 * @param {string} address - User's Ethereum address (optional)
 * @returns {Promise<Object>} Object containing user information
 */
export const getUserInfo = async (address) => {
  try {
    const contract = getContract();
    const userAddress = address || await getCurrentUserAddress();
    const user = await contract.getUserInfo(userAddress);
    
    return {
      success: true,
      name: user.name,
      email: user.email,
      isRegistered: user.isRegistered,
      registrationDate: new Date(user.registrationDate.toNumber() * 1000).toLocaleString()
    };
  } catch (error) {
    return {
      success: false,
      name: "",
      email: "",
      isRegistered: false,
      registrationDate: "",
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Get current user's Ethereum address
 * @returns {Promise<string>} User's Ethereum address
 */
const getCurrentUserAddress = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return await signer.getAddress();
  } catch (error) {
    console.error("Failed to get current user address:", error);
    throw error;
  }
};

/**
 * Check if current wallet is the library owner
 * @returns {Promise<Object>} Object with success status and isOwner boolean
 */
export const isLibraryOwner = async () => {
  try {
    const contract = getContract();
    const owner = await contract.owner();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    return {
      success: true,
      isOwner: owner.toLowerCase() === address.toLowerCase()
    };
  } catch (error) {
    console.error("Failed to check if user is owner:", error);
    return {
      success: false,
      isOwner: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Add a new book to the library
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @param {string} borrowPrice - Borrow price in Ether
 * @returns {Promise<Object>} Object containing success status and status message
 */
export const addBook = async (title, author, borrowPrice) => {
  try {
    const contract = getContract();
    const price = ethers.utils.parseEther(borrowPrice);
    const tx = await contract.addBook(title, author, price);
    await tx.wait();
    return {
      success: true,
      status: `Book "${title}" added successfully!`
    };
  } catch (error) {
    return {
      success: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Get library balance - shows the accumulated fees available for withdrawal
 * @returns {Promise<Object>} Balance information
 */
export const getLibraryBalance = async () => {
  try {
    // Get contract instance
    const contract = getContract();
    
    // Get the contract's balance directly from the provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balanceWei = await provider.getBalance(contractAddress.address);
    const balance = ethers.utils.formatEther(balanceWei);
    
    return {
      success: true,
      balance
    };
  } catch (error) {
    console.error("Failed to get library balance:", error);
    return {
      success: false,
      balance: "0",
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Withdraw funds from the contract to the admin wallet
 * @returns {Promise<Object>} Result of the withdrawal operation
 */
export const withdrawFunds = async () => {
  try {
    const contract = getContract();
    
    // Call the withdraw function
    const tx = await contract.withdrawFunds();
    const receipt = await tx.wait();
    
    return {
      success: true,
      status: `Successfully withdrawn funds to admin wallet. Transaction: ${receipt.transactionHash}`
    };
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    
    // Handle specific errors
    if (error.message.includes("No funds to withdraw")) {
      return {
        success: false,
        status: "There are currently no funds in the contract to withdraw."
      };
    }
    
    return {
      success: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Transfer ownership of the library
 * @param {string} newOwnerAddress - Ethereum address of the new owner
 * @returns {Promise<Object>} Object containing success status and status message
 */
export const transferOwnership = async (newOwnerAddress) => {
  try {
    const contract = getContract();
    const tx = await contract.transferOwnership(newOwnerAddress);
    await tx.wait();
    return {
      success: true,
      status: `Ownership transferred to ${newOwnerAddress} successfully!`
    };
  } catch (error) {
    return {
      success: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Get all books in the library
 * @returns {Promise<Object>} Object containing success status and books array
 */
export const getAllBooks = async () => {
  try {
    const contract = getContract();
    const books = await contract.getAllBooks();
    return {
      success: true,
      books: books.map(book => ({
        id: book.id.toNumber(),
        title: book.title,
        author: book.author,
        borrowPrice: ethers.utils.formatEther(book.borrowPrice),
        available: book.available
      }))
    };
  } catch (error) {
    return {
      success: false,
      books: [],
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Borrow a book from the library
 * @param {number} id - Book ID
 * @param {string} price - Borrow price in Ether
 * @returns {Promise<Object>} Object containing success status and status message
 */
export const borrowBook = async (id, price) => {
  try {
    const contract = getContract();
    
    // Convert price to wei
    const priceWei = ethers.utils.parseEther(price.toString());
    
    // Borrow the book
    const tx = await contract.borrowBook(id, { value: priceWei });
    await tx.wait();
    
    return {
      success: true,
      status: "Book borrowed successfully! The fee has been collected in the contract for admin withdrawal."
    };
  } catch (error) {
    console.error("Error borrowing book:", error);
    return {
      success: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Return a borrowed book (admin only)
 * @param {number} id - Book ID
 * @returns {Promise<Object>} Object containing success status and status message
 */
export const returnBook = async (id) => {
  try {
    const contract = getContract();
    const tx = await contract.returnBook(id);
    await tx.wait();
    return {
      success: true,
      status: "Book returned successfully!"
    };
  } catch (error) {
    return {
      success: false,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Get the borrower of a book (admin only)
 * @param {number} id - Book ID
 * @returns {Promise<Object>} Object containing success status and borrower address
 */
export const getBookBorrower = async (id) => {
  try {
    const contract = getContract();
    const borrowerAddress = await contract.getBookBorrower(id);
    return {
      success: true,
      borrower: borrowerAddress
    };
  } catch (error) {
    return {
      success: false,
      borrower: null,
      status: `Error: ${error.message}`
    };
  }
};

/**
 * Get all borrowed books
 * @returns {Promise<Object>} Object containing success status and books array
 */
export const getBorrowedBooks = async () => {
  try {
    const contract = getContract();
    const books = await contract.getBorrowedBooks();
    return {
      success: true,
      books: books.map(book => ({
        id: book.id.toNumber(),
        title: book.title,
        author: book.author,
        borrowPrice: ethers.utils.formatEther(book.borrowPrice),
        available: book.available
      }))
    };
  } catch (error) {
    return {
      success: false,
      books: [],
      status: `Error: ${error.message}`
    };
  }
};
