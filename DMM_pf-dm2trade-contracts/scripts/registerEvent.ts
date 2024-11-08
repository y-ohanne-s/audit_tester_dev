import { ethers } from "hardhat";

async function main() {
    const [sender] = await ethers.getSigners();

    // TODO:envと引数を検討
    // DM2TradeRewardPoolコントラクトのアドレスを指定してください
    const rewardPoolAddress = "0xaba0F170A67ea6a84dDfd6992b7fF18F66Aad0e4";

    // DM2TradeRewardPoolコントラクトのABI
    const rewardPoolAbi = [
        "function registerEvent(string calldata _treventID, address _tokenContract, uint256 _rewardAmount) external",
    ];

    // DM2TradeRewardPoolコントラクトのインスタンスを作成
    const rewardPool = new ethers.Contract(rewardPoolAddress, rewardPoolAbi, sender);

    // 必要な引数を設定
    const eventId = "2"; // TODO:イベントIDを指定
    const tokenContractAddress = "0xA886c65E7CE86325B645053c01d36D651e97C0AE"; // TODO:トークンコントラクトのアドレスを指定 old:0x10d052b5bB7f8B807cC2C734144b17339A5Cf7F7
    const rewardAmount = ethers.parseUnits("60", 18); // TODO:報酬額を指定

    // ガスオプションの設定
    const options = {
        gasLimit: 8000000, // 
        gasPrice: 0, // 適切なガス価格を指定
    };

    try {
        // registerEvent関数を呼び出し
        const tx = await rewardPool.registerEvent(eventId, tokenContractAddress, rewardAmount, options);

        console.log("Sending transaction:", tx.hash);

        // トランザクションが完了するのを待ちます
        await tx.wait();

        console.log("Transaction confirmed!");
    } catch (error) {
        console.error("Transaction failed:", error);
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
