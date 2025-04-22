const path = require('path');
const fs = require('fs');

// Use absolute path to locate artifact files
const projectRoot = path.resolve(__dirname, '../../../');

// Function to get contract artifact
function getContractArtifact(contractName) {
  // Try multiple possible paths
  const possiblePaths = [
    path.join(projectRoot, `artifacts/contracts/${contractName}.sol/${contractName}.json`),
    path.join(projectRoot, `artifacts/contracts/${contractName}.json`),
    path.join(projectRoot, `contracts/${contractName}.json`)
  ];
  
  for (const artifactPath of possiblePaths) {
    if (fs.existsSync(artifactPath)) {
      console.log(`Found contract artifact at: ${artifactPath}`);
      return require(artifactPath);
    }
  }
  
  throw new Error(`Contract artifact not found for ${contractName}. Checked paths: ${possiblePaths.join(', ')}`);
}

// Export contract artifacts
const contracts = {
  MonadArenaCore: getContractArtifact('MonadArenaCore'),
  MonadArenaNFT: getContractArtifact('MonadArenaNFT'),
  // Add other contracts as needed
};

module.exports = contracts;