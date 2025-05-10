# Importing a Hardhat Test Account to MetaMask

## Get the Private Key

1. Run your Hardhat node in one terminal:
   ```
   npx hardhat node
   ```

2. In another terminal, run the account display script:
   ```
   node scripts/get-accounts.js
   ```
   or
   ```
   npx hardhat run scripts/get-accounts.js
   ```

3. Copy one of the private keys displayed in the terminal.

## Import to MetaMask

1. Open your MetaMask extension
2. Make sure you're connected to "Hardhat Local" network
3. Click on your account icon in the top-right
4. Select "Import Account"
5. Paste the private key (remove the '0x' prefix if present)
6. Click "Import"

You should now have access to a test account with 10000 ETH.

**Important**: The first account (index 0) is the deployer account and likely the contract owner. Make sure to import this account if you need admin privileges.

## Verify Contract Ownership

If you need admin privileges, ensure you're using the same account that deployed the contract.

1. In your app, connect MetaMask with the imported account
2. Verify you can access admin functions

If you deployed with Account #0, but imported a different account, you won't have admin privileges.
