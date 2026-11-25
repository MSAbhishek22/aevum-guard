// Deploy AevumGuard to Aevum testnet (44005).
// USER-GATED: do not run until DEPLOY_CHECKLIST.md is complete — it needs the
// user's MetaMask deployer (private key supplied via env at deploy time only,
// never committed) and the confirmed tUSD8 address below.
const { ethers } = require("hardhat");

const TUSD8 = "0x456569838f1d43009A91ebA4263147Afd7233483"; // official QDay address, re-verify at deploy

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployer account configured — see DEPLOY_CHECKLIST.md");
  console.log("Deployer:", deployer.address);
  const F = await ethers.getContractFactory("AevumGuard");
  const guard = await F.deploy(TUSD8);
  await guard.waitForDeployment();
  console.log("AevumGuard deployed to:", await guard.getAddress());
  console.log("Verify this address + tx hash on https://explorer-test.qday.info and record them in the submission pack.");
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
