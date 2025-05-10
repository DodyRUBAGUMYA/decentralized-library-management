const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Get the first account explicitly
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  
  // Deploy the contract
  const LibraryManagement = await hre.ethers.getContractFactory("LibraryManagement");
  const library = await LibraryManagement.deploy();

  await library.deployed();

  console.log("LibraryManagement deployed to:", library.address);
  console.log("Owner address (your admin account):", deployer.address);
  
  // Save the contract address for frontend use
  fs.writeFileSync(
    './frontend/src/contractAddress.json',
    JSON.stringify({ address: library.address }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
