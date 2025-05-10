// Script to check if an address is the contract owner
const hre = require("hardhat");
const contractAddress = require("../frontend/src/contractAddress.json");

async function main() {
  // Get the contract instance
  const LibraryManagement = await hre.ethers.getContractFactory("LibraryManagement");
  const libraryContract = await LibraryManagement.attach(contractAddress.address);
  
  // Get the owner address
  const ownerAddress = await libraryContract.owner();
  
  console.log("Contract Information:");
  console.log(`- Contract Address: ${contractAddress.address}`);
  console.log(`- Owner Address: ${ownerAddress}`);
  
  console.log("\nYour Current Accounts:");
  const accounts = await hre.ethers.getSigners();
  for (let i = 0; i < 5; i++) {
    const isOwner = accounts[i].address.toLowerCase() === ownerAddress.toLowerCase();
    console.log(`- Account ${i}: ${accounts[i].address} ${isOwner ? '(OWNER)' : ''}`);
  }
  
  console.log("\nTo use admin features:");
  console.log("1. Import the account marked as (OWNER) into MetaMask");
  console.log("2. Connect to your app using that account");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
