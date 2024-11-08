import { ethers } from "hardhat";

async function main() {
  const options = {
    gasLimit: 8000000, // 必要に応じて調整
    gasPrice: 0, 
  };

  const [deployer] = await ethers.getSigners();

  console.log("アカウント:", deployer.address);

  const MyContract = await ethers.getContractFactory("DM2TradeRewardPool");
  console.log("コントラクトファクトリの取得に成功しました");
  
  // デプロイ用の引数を確認
  const rewardGateway = "0x660fAd05fA2A2978f81E44F7322E72a53774C71e";
  const verifier = "0x4b863994AAf151e6F761735eCdf8d16B161239Cd";
  const verifier2 = "0x7f45A1eAEC1a2c91fE5a1331b14C95ea3Ea17188";
  const verifier3 = "0x0dc484493fdd6f712cf45cc25a79e1a890d0a070";
  const controller = "0x4b863994AAf151e6F761735eCdf8d16B161239Cd";
  const controller2 = "0x7f45A1eAEC1a2c91fE5a1331b14C95ea3Ea17188";
  const controller3 = "0x0dc484493fdd6f712cf45cc25a79e1a890d0a070";
  const withdrawRecipient = "0x7f45A1eAEC1a2c91fE5a1331b14C95ea3Ea17188";

  console.log("デプロイの引数:", rewardGateway, verifier, controller, withdrawRecipient );

  try {
    const myContract = await MyContract.deploy( 
      rewardGateway, 
      verifier, 
      //verifier2, 
      //verifier3, 
      controller, 
      //controller2, 
      //controller3, 
      withdrawRecipient, 
      options);
    const contractAddress = await myContract.getAddress();
    console.log("DM2TradeRewardPoolがデプロイされました:", contractAddress);
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
