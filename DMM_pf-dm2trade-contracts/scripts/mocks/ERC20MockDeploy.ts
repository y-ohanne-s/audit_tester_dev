import { ethers } from "hardhat";

async function main() {
  const options = {
    gasLimit: 8000000, // 必要に応じて調整
    gasPrice: 0, 
  };

  const [deployer] = await ethers.getSigners();

  console.log("アカウント:", deployer.address);

  const MyContract = await ethers.getContractFactory("ERC20Mock");
  console.log("コントラクトファクトリの取得に成功しました");
  
  // デプロイ用の引数を確認
  const name = "TestToken";
  const symbol = "TT";
  const initialSupply = 100000 * 10 ** 10; //100000000
  //const user1 = "0x4b863994AAf151e6F761735eCdf8d16B161239Cd";
  //const user2 = "0x7f45A1eAEC1a2c91fE5a1331b14C95ea3Ea17188";

  console.log("デプロイの引数:", name, symbol, initialSupply );

  try {
    const myContract = await MyContract.deploy( 
      name, 
      symbol, 
      initialSupply,
      options);
    const contractAddress = await myContract.getAddress();
    console.log("ERC20Mockがデプロイされました:", contractAddress);
  } catch (error) {
    console.error("デプロイ中にエラーが発生しました:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
