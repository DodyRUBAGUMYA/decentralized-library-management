# Library Management DApp

A decentralized library management system built with Ethereum blockchain, Solidity, Hardhat, and React.

## Project Overview

This application allows users to:
- Browse available books in a decentralized library
- Borrow books by paying a small deposit in ETH
- Return books (admin only)
- Register with email for communication

Administrators can:
- Add new books to the library
- Set borrowing prices for each book
- Process book returns
- Withdraw collected fees

## Technical Architecture

### Smart Contracts
- `LibraryManagement.sol`: Main contract for the library system
- Built with Solidity 0.8.19
- Implements security best practices including access controls and validation

### Frontend
- React-based UI with Web3 integration
- MetaMask wallet support with account selection
- Responsive design for all devices

### Development Environment
- Hardhat local blockchain for development and testing
- Automated test account generation and contract deployment

## Getting Started

### Prerequisites
- Node.js v14+
- MetaMask browser extension

### Quick Start

1. Clone the repository
```bash
git clone <repository-url>
cd library-management-dapp
```

2. Install dependencies
```bash
npm run setup
```

3. Start the application
```bash
npm run runsystem
```

This will:
- Start a local Hardhat node
- Deploy the smart contract
- Save test account information to test-accounts.txt
- Start the React frontend

4. Connect MetaMask to the local network:
- Network Name: Hardhat Local
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency Symbol: ETH

5. Import the admin account (first account from test-accounts.txt) to use admin features

## Project Structure

