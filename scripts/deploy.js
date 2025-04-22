const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Monad Arena contracts...");
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Deploy Token
  console.log("Deploying token contract...");
  const TokenFactory = await ethers.getContractFactory("MonadArenaToken");
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();                            // ← v6
  console.log("Token contract deployed to:", token.target);   // ← v6

  // Deploy NFT
  console.log("Deploying NFT contract...");
  const NFTFactory = await ethers.getContractFactory("MonadArenaNFT");
  const nft = await NFTFactory.deploy();
  await nft.waitForDeployment();
  console.log("NFT contract deployed to:", nft.target);

  // Deploy Core
  console.log("Deploying core contract...");
  const CoreFactory = await ethers.getContractFactory("MonadArenaCore");
  const core = await CoreFactory.deploy(token.target, nft.target);
  await core.waitForDeployment();
  console.log("Core contract deployed to:", core.target);

  // Set up relationships
  console.log("Setting up contract relationships...");
  let tx;

  tx = await token.setGameCoreContract(core.target);
  await tx.wait();
  console.log("→ Set game core in token");

  tx = await nft.setGameCoreContract(core.target);
  await tx.wait();
  console.log("→ Set game core in NFT");

  tx = await core.addAuthorizedServer(deployer.address);
  await tx.wait();
  console.log("→ Added deployer as authorized server");

  console.log("✅ Deployment complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
