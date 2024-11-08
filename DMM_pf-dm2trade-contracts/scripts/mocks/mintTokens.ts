import { ethers } from "ethers";
import * as dotenv from "dotenv";

// .env ファイルから環境変数を読み込む
dotenv.config();

// 環境に合わせてプロバイダーを設定します
const provider = new ethers.JsonRpcProvider("https://rpc.testnet.dm2verse.dmm.com/"); // デプロイ済みのネットワークの RPC URL を設定

// デプロイ済みのトークンコントラクトのアドレス
const contractAddress = "0xA886c65E7CE86325B645053c01d36D651e97C0AE";

// .env からプライベートキーを取得
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error("プライベートキーが設定されていません。");
}

// プライベートキーからウォレットを作成
const wallet = new ethers.Wallet(privateKey, provider);

async function main() {
// コントラクトの ABI（必要な部分だけを定義）
  const abi = [
    "function mint(address to, uint256 amount) public"
  ];

  // コントラクトインスタンスを作成
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  // ミントするアドレスと量
  const mintToAddress = "0x4b863994AAf151e6F761735eCdf8d16B161239Cd";
  const amountToMint = ethers.parseUnits("100000000", 18); // 18 桁の小数点

  try {
    // ミント処理を実行
    const tx = await contract.mint(mintToAddress, amountToMint);
    console.log("ミントトランザクション:", tx.hash);

    // トランザクションの完了を待つ
    const receipt = await tx.wait();
    console.log("トランザクション完了:", receipt.transactionHash);
  } catch (error) {
    console.error("ミント中にエラーが発生しました:", error);
  }
}

main().catch(console.error);
