// Script to display test account private keys
const hre = require("hardhat");

async function main() {
  const accounts = await hre.ethers.getSigners();
  
  console.log("Test accounts with 10000 ETH each:");
  console.log("=================================");
  
  for (let i = 0; i < 5; i++) {
    const account = accounts[i];
    console.log(`Account ${i}:`);
    console.log(`- Address: ${account.address}`);
    // In an actual project you should never log private keys
    // This is only for development purposes on a local network
    console.log(`- Private Key: ${account.privateKey}`);
    console.log("");
  }
  
  console.log("To import into MetaMask:");
  console.log("1. Open MetaMask → Click on account icon → Import Account");
  console.log("2. Paste the private key (without '0x' prefix)");
  console.log("3. Click Import");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
