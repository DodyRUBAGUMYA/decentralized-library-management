const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Output file for test accounts
const testAccountsFile = path.join(__dirname, '..', 'test-accounts.txt');

// Function to print a header
function printHeader(text) {
  console.log(`\n${colors.bright}${colors.blue}======== ${text} ========${colors.reset}\n`);
}

// Function to run a command
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    printHeader(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, { 
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code !== 0 && !options.ignoreError) {
        reject(`Command failed with code ${code}`);
      } else {
        resolve();
      }
    });
  });
}

// Function to extract private keys from Hardhat node output
function extractAccountInfo(output) {
  const accounts = [];
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Account #')) {
      const addressLine = lines[i];
      const privateKeyLine = lines[i+1];
      
      if (addressLine && privateKeyLine) {
        const addressMatch = addressLine.match(/0x[0-9a-fA-F]{40}/);
        const privateKeyMatch = privateKeyLine.match(/0x[0-9a-fA-F]{64}/);
        
        if (addressMatch && privateKeyMatch) {
          accounts.push({
            index: addressLine.match(/Account #(\d+)/)[1],
            address: addressMatch[0],
            privateKey: privateKeyMatch[0]
          });
        }
      }
    }
  }
  
  return accounts;
}

// Function to save test accounts to file
function saveTestAccounts(accounts, deployedContractAddress) {
  const stream = fs.createWriteStream(testAccountsFile);
  
  stream.write('=== LIBRARY MANAGEMENT SYSTEM TEST ACCOUNTS ===\n\n');
  stream.write(`Timestamp: ${new Date().toLocaleString()}\n\n`);
  
  // Mark the admin account clearly
  stream.write(`ADMIN/OWNER ACCOUNT (use this for admin functions):\n`);
  stream.write(`--------------------------------\n`);
  stream.write(`Account #${accounts[0].index}: ${accounts[0].address}\n`);
  stream.write(`Private Key: ${accounts[0].privateKey}\n\n`);
  
  // Write contract address
  if (deployedContractAddress) {
    stream.write(`Deployed Contract Address: ${deployedContractAddress}\n\n`);
  }
  
  stream.write('OTHER TEST ACCOUNTS:\n');
  stream.write('--------------------------------\n');
  for (let i = 1; i < Math.min(accounts.length, 5); i++) {
    stream.write(`Account #${accounts[i].index}: ${accounts[i].address}\n`);
    stream.write(`Private Key: ${accounts[i].privateKey}\n\n`);
  }
  
  stream.write('HOW TO USE THESE ACCOUNTS:\n');
  stream.write('1. Open MetaMask -> Add Network -> Add network manually\n');
  stream.write('2. Network Name: Hardhat Local\n');
  stream.write('3. RPC URL: http://127.0.0.1:8545\n');
  stream.write('4. Chain ID: 31337\n');
  stream.write('5. Currency Symbol: ETH\n');
  stream.write('6. Import Account -> Paste the private key (remove the 0x prefix)\n\n');
  stream.write('IMPORTANT: Use the ADMIN account for admin functions in the library\n\n');
  stream.write('NOTE: When users borrow books, fees are stored in the contract.\n');
  stream.write('      The admin can withdraw these fees from the Admin Dashboard.\n');
  
  stream.end();
  console.log(`${colors.green}Test accounts saved to ${testAccountsFile}${colors.reset}`);
}

// Main function to run the entire system
async function runSystem() {
  try {
    let accountsData = '';
    let accounts = [];
    let deployedContractAddress = null;
    
    // 1. Start Hardhat node in background
    printHeader('Starting Hardhat Node');
    const hardhatNode = spawn('npx', ['hardhat', 'node'], { 
      stdio: 'pipe',
      shell: true
    });
    
    // Process Hardhat node output
    let nodeReady = false;
    hardhatNode.stdout.on('data', (data) => {
      const output = data.toString();
      accountsData += output;
      
      // Check if we've collected account information
      if (output.includes('Account #19:') && !nodeReady) {
        accounts = extractAccountInfo(accountsData);
        
        console.log(`${colors.green}✔ Hardhat node is running with ${accounts.length} test accounts${colors.reset}`);
        console.log(`${colors.yellow}Admin account: ${accounts[0].address}${colors.reset}`);
        nodeReady = true;
      }
      
      // Print errors
      if (output.toLowerCase().includes('error')) {
        console.error(`${colors.red}${output}${colors.reset}`);
      }
    });
    
    // Wait for node to be ready
    await new Promise(resolve => {
      const checkReady = () => {
        if (nodeReady) {
          resolve();
        } else {
          setTimeout(checkReady, 1000);
        }
      };
      setTimeout(checkReady, 2000);
    });
    
    // 2. Deploy the contract
    printHeader('Deploying Contract');
    const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], {
      stdio: 'pipe',
      shell: true
    });
    
    // Capture the deployed contract address
    let deployOutput = '';
    deployProcess.stdout.on('data', (data) => {
      const output = data.toString();
      deployOutput += output;
      console.log(output);
      
      // Extract contract address
      const match = output.match(/LibraryManagement deployed to: (0x[a-fA-F0-9]{40})/);
      if (match && match[1]) {
        deployedContractAddress = match[1];
      }
    });
    
    await new Promise((resolve) => {
      deployProcess.on('close', resolve);
    });
    
    // Display important warnings
    console.log(`${colors.yellow}⚠️ IMPORTANT: If you've modified the smart contract, make sure to redeploy it${colors.reset}`);
    console.log(`${colors.yellow}   to ensure your changes are reflected in the deployed contract.${colors.reset}`);
    
    // Save test accounts once we have the contract address
    if (accounts.length > 0) {
      saveTestAccounts(accounts, deployedContractAddress);
    }
    
    // Display the MetaMask setup instructions
    printHeader('MetaMask Setup Instructions');
    console.log(`${colors.cyan}IMPORTANT: Import the admin private key to MetaMask to have admin access!${colors.reset}`);
    console.log(`${colors.cyan}Admin Account: ${accounts[0].address}${colors.reset}`);
    console.log(`${colors.cyan}Admin Private Key: ${accounts[0].privateKey}${colors.reset}`);
    console.log(`${colors.green}Book borrowing fees are now stored in the contract for admin withdrawal${colors.reset}`);
    console.log(`${colors.bright}Instructions saved to test-accounts.txt${colors.reset}`);
    
    // 3. Start React frontend
    printHeader('Starting Frontend');
    await runCommand('npm', ['start'], { cwd: path.join(process.cwd(), 'frontend') });
    
  } catch (error) {
    console.error(`${colors.red}Error running the system: ${error}${colors.reset}`);
    process.exit(1);
  }
}

// Run the system
runSystem();
