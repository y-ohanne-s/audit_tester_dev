import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  gasReporter: {
    enabled: process.env.COINMARKETCAP_API_KEY ? true : false,
    currency: "JPY",
    // for Polygon
    gasPriceApi:
      "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
    // gasPriceApi: // for Ethereum
    //   "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "MATIC",
  },
  networks: {
    hardhat: {},
  },
  etherscan: {
    apiKey: {
      polygon: process.env["POLYGONSCAN_KEY"] || "",
      polygonMumbai: process.env["POLYGONSCAN_KEY"] || "",
    },
  },
};
if (process.env.POLYGON_PROVIDER_ENDPOINT_TESTNET) {
  config.networks!.polygon = {
    url: process.env.POLYGON_PROVIDER_ENDPOINT_MAINNET,
    accounts: [`${process.env.POLYGON_PRIVATE_KEY}`],
  };
  config.networks!.mumbai = {
    url: process.env.POLYGON_PROVIDER_ENDPOINT_TESTNET,
    accounts: [`${process.env.POLYGON_PRIVATE_KEY}`],
  };
}

export default config;
