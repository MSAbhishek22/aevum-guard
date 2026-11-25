require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

/** Aevum testnet (44005) is configured for a later, user-gated deploy only.
 *  No keys are stored here — deploy uses the user's MetaMask address flow
 *  described in DEPLOY_CHECKLIST.md. Local tests run on the in-process network. */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    aevumTestnet: {
      url: "https://rpc-test.qday.info",
      chainId: 44005,
      accounts: [],
    },
  },
};
