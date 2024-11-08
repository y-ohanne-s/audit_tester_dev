import { ethers } from "hardhat";

async function main() {
    const [sender] = await ethers.getSigners();

    // TODO:envと引数を検討
    // ERC20トークンコントラクトのアドレスと報酬プールコントラクトのアドレスを指定してください
    const erc20TokenAddress = "0x10d052b5bB7f8B807cC2C734144b17339A5Cf7F7";
    const rewardPoolAddress = "0xA092db729327c473F1a7Bce83A48414287A4E942";

    // ERC20トークンコントラクトのABI
    const erc20Abi = [
        "function balanceOf(address account) external view returns (uint256)",
    ];

    // ERC20トークンコントラクトのインスタンスを作成
    const token = new ethers.Contract(erc20TokenAddress, erc20Abi, sender);

    // 報酬プールコントラクトの残高を取得
    const balance = await token.balanceOf(rewardPoolAddress);

    // TODO:小数点数を変更する必要あり envにする。
    console.log(`Reward pool balance: ${ethers.formatUnits(balance, 10)} tokens`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
