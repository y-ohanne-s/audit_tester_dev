import { ethers } from "hardhat";

async function main() {
    const options = {
        gasLimit: 8000000, // 必要に応じて調整
        gasPrice: 0, 
    };
    
    const [sender] = await ethers.getSigners();

    // TODO:envと引数を検討
    // ERC20トークンコントラクトのアドレスと報酬プールコントラクトのアドレスを指定してください
    const erc20TokenAddress = "0x10d052b5bB7f8B807cC2C734144b17339A5Cf7F7";
    const rewardPoolAddress = "0xaba0F170A67ea6a84dDfd6992b7fF18F66Aad0e4";

    // ERC20トークンコントラクトのABI
    const erc20Abi = [
        "function transfer(address to, uint256 amount) public returns (bool)",
    ];

    // ERC20トークンコントラクトのインスタンスを作成
    const token = new ethers.Contract(erc20TokenAddress, erc20Abi, sender);

    // 転送するトークンの量を指定します (例: 100トークン)
    const amount = ethers.parseUnits("100", 10); // 10はERC20トークンの小数点桁数です

    // トークンを報酬プールコントラクトに送信します
    const tx = await token.transfer(rewardPoolAddress, amount, options);

    console.log("Sending transaction:", tx.hash);

    // トランザクションが完了するのを待ちます
    await tx.wait();

    console.log("Transaction confirmed!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
