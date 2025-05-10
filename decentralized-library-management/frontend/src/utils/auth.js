import { isLibraryOwner } from './interact';

/**
 * Check if the current user is an admin and has necessary permissions
 * @returns {Promise<boolean>} Whether the user is an admin
 */
export const checkAdminAccess = async () => {
  try {
    const response = await isLibraryOwner();
    return response.success && response.isOwner;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Subscribe to MetaMask account changes
 * @param {function} callback - Function to call when accounts change
 * @returns {function} Cleanup function to remove listener
 */
export const subscribeToAccountChanges = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
    
    return () => {
      window.ethereum.removeListener('accountsChanged', callback);
    };
  }
  
  return () => {};
};

/**
 * Clear authentication state
 */
export const clearAuthState = () => {
  localStorage.removeItem('walletConnected');
  localStorage.removeItem('selectedAccount');
  localStorage.removeItem('adminAccount');
};
