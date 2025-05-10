const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to save test accounts
const outputFile = path.join(__dirname, '..', 'test-accounts.txt');

// Run Hardhat node and capture output
const hardhatNode = spawn('npx', ['hardhat', 'node'], { shell: true });

console.log('Starting Hardhat node and saving accounts to test-accounts.txt...');

// Open file for writing
const stream = fs.createWriteStream(outputFile);
stream.write('=== HARDHAT TEST ACCOUNTS ===\n\n');
stream.write('These accounts have 10000 ETH each. Import the private key into MetaMask.\n');
stream.write('The first account (Account #0) is the contract deployer and admin.\n\n');

// Track if we've processed the accounts section
let accountsProcessed = false;

hardhatNode.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Save the output to file
    stream.write(output);
    
    // Check if we've processed all the accounts
    if (output.includes('Account #19:') && !accountsProcessed) {
        accountsProcessed = true;
        console.log('\nTest accounts have been saved to test-accounts.txt');
        console.log('You can now use these accounts for testing the DApp.\n');
    }
});

hardhatNode.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
    stream.write(`Error: ${data}`);
});

// Handle Ctrl+C to clean up
process.on('SIGINT', () => {
    console.log('\nStopping Hardhat node...');
    stream.end();
    hardhatNode.kill();
    process.exit();
});
