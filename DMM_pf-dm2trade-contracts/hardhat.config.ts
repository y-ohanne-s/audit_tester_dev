import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "dotenv/config";
import { HDNodeWallet, Wallet } from "ethers";

// Mnemonicとプライベートキーの読み込み
const mnemonic: string | undefined = process.env.MNEMONIC;
const privateKey: string | undefined = process.env.PRIVATE_KEY;

if (!mnemonic && !privateKey) {
  throw new Error("MNEMONIC or PRIVATE_KEY must be defined in the environment variables");
}

// Mnemonicからウォレットを作成
let wallet;
if (mnemonic) {
  wallet = HDNodeWallet.fromPhrase(mnemonic);
} else if (privateKey) {
  //wallet = new ethers.Wallet(privateKey);
  wallet = new Wallet(privateKey);
}

//const privateKey = wallet.privateKey;
const accounts = wallet ? [wallet.privateKey] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  typechain: {
    outDir: "typechain-types",  // 型定義ファイルの出力先
    target: "ethers-v6"  // ethers のバージョン
  },
  networks: {
    // dm2verseテストネット
    dm2testnet: {
      url: "https://rpc.testnet.dm2verse.dmm.com",
      chainId: 68775,
      //accounts: [privateKey]
      accounts: accounts
    }
  }
};

export default config;
