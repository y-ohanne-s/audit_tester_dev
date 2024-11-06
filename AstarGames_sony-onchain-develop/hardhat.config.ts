import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "solidity-coverage";
import "hardhat-watcher";
import "hardhat-contract-sizer";

dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: "sepolia",
  networks: {
    polygon: {
      url: process.env.POLYGON_URL as string,
      chainId: Number(process.env.POLYGON_CHAIN_ID || 80001),
      gasPrice: 20000000000,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY as string] : [],
    },
    astarZkEvm: {
      url: process.env.ASTAR_URL as string,
      chainId: Number(process.env.ASTAR_CHAIN_ID || 43113),
      gasPrice: 20000000000,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY as string] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_URL as string,
      chainId: Number(process.env.SEPOLIA_CHAIN_ID || 11155111),
      gasPrice: 20000000000,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY as string] : [],
    },
    hardhat: {
      chainId: 1337,
      gasPrice: 20000000000,
      accounts: {
        mnemonic: process.env.MNEMONIC as string,
        initialIndex: 0,
        count: 10,
      }
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGON_API_KEY as string,
      polygon: process.env.POLYGON_API_KEY as string,
      sepolia: process.env.SEPOLIA_API_KEY as string,
    },
  },
  watcher: {
    compilation: {
      tasks: ["compile"],
      files: ["./contracts"],
      verbose: true,
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
};

export default config;
