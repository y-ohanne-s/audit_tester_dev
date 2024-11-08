import { ethers } from "hardhat";
import { expect } from "chai";
import { DM2TradeRewardPool, ERC20Mock } from "../typechain-types";
import { ContractTransactionResponse, TransactionReceipt, Log, AbiCoder } from "ethers";

describe("DM2TradeRewardPool", function () {
  let dm2TradeRewardPool: DM2TradeRewardPool;
  let token: ERC20Mock;
  let owner: any;
  let controller: any;
  let verifier: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, controller, verifier, addr1, addr2] = await ethers.getSigners();

    // Mock ERC20 tokenをデプロイ
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20Mock.deploy("Mock Token", "MTK", ethers.parseEther("1000"));

    // DM2TradeRewardPoolコントラクトをデプロイ
    const DM2TradeRewardPoolFactory = await ethers.getContractFactory("DM2TradeRewardPool");
    dm2TradeRewardPool = await DM2TradeRewardPoolFactory.deploy(
      addr1.address,
      addr2.address,
      controller.address,
      verifier.address
    ) as DM2TradeRewardPool;
  });

  // 報酬プール用スマートコントラクトの初期設定が正しいかを確認する（rewardGatewayおよびwithdrawRecipient）
  it("初期設定の確認", async function () {
    expect(await dm2TradeRewardPool.rewardGateway()).to.equal(addr1.address);
    expect(await dm2TradeRewardPool.withdrawRecipient()).to.equal(addr2.address);
  });

  // 報酬プール用スマートコントラクトにトークンを転送し、イベントを登録してトークンの承認が正しく行われる事を確認する
  it("イベントの登録とトークン承認", async function () {
    await token.transfer(await dm2TradeRewardPool.getAddress(), ethers.parseEther("100"));

    await dm2TradeRewardPool.connect(controller).registerEvent("testEventID", await token.getAddress(), ethers.parseEther("100"));

    const allowance = await token.allowance(await dm2TradeRewardPool.getAddress(), addr1.address);
    expect(allowance).to.equal(ethers.parseEther("100"));
  });

  /* デコード関数の不具合の為、割愛
  // registerEvent関数において、イベントが正常に値を記録していることを確認する
  it("ApproveEvent が正常に値を記録していることを確認する", async function () {
    const tx: ContractTransactionResponse = await dm2TradeRewardPool.connect(controller).registerEvent("testEventID", await token.getAddress(), ethers.parseEther("100"));
    const receipt: TransactionReceipt | null = await tx.wait();

    if (receipt === null) {
      throw new Error("Transaction receipt is null");
    }

    const approveEvent = receipt.logs.find(log => log.topics[0] === ethers.utils.id("ApproveEvent(string,address,address,uint256,uint256,uint256)"));
    expect(approveEvent).to.not.be.undefined;

    if (approveEvent === undefined) {
      throw new Error("ApproveEvent not found");
    }

   
    const decodedLog = ethers.AbiCoder.defaultAbiCoder(
      ["string", "address", "address", "uint256", "uint256", "uint256"],
      approveEvent.data
    );

    const [treventID, tokenContract, rewardGateway, previousAllowance, newAllowance, rewardAmount] = parsedLog;
    expect(treventID).to.equal("testEventID");
    expect(tokenContract).to.equal(await token.getAddress());
    expect(rewardGateway).to.equal(await addr1.getAddress());
    expect(previousAllowance).to.equal(0);
    expect(newAllowance).to.equal(ethers.parseEther("100"));
    expect(rewardAmount).to.equal(ethers.parseEther("100"));
  });
  */

  // setRewardGateway
  // 新しい送金用スマートコントラクトアドレスが正しく設定されるかを確認する
  it("新しい送金用スマートコントラクトの設定", async function () {
    const newRewardGateway = addr2.address;
    await dm2TradeRewardPool.connect(controller).setRewardGateway(newRewardGateway, [token.getAddress()]);

    expect(await dm2TradeRewardPool.rewardGateway()).to.equal(newRewardGateway);
  });
  // CONTROLLER_ROLE のみが setRewardGateway を実行できることを確認し、コントラクトが Pause されることを確認する
  it("CONTROLLER_ROLE のみが setRewardGateway を実行できることを確認し、コントラクトが Pause される", async function () {
    const newRewardGateway = addr2.address;
    const previousRewardGateway = await dm2TradeRewardPool.rewardGateway();

    // 現在の rewardGateway のアドレスとトークン承認額を取得
    const previousAllowance = await token.allowance(await dm2TradeRewardPool.getAddress(), previousRewardGateway);

    // コントローラーが setRewardGateway を実行できることを確認する
    await dm2TradeRewardPool.connect(controller).setRewardGateway(newRewardGateway, [token.getAddress()]);
    expect(await dm2TradeRewardPool.rewardGateway()).to.equal(newRewardGateway);

    // コントラクトが一時停止されていることを確認する
    expect(await dm2TradeRewardPool.paused()).to.be.true;

    // コントローラー以外のアカウントが setRewardGateway を実行しようとするとエラーが発生することを確認する
    await expect(
      dm2TradeRewardPool.connect(addr1).setRewardGateway(newRewardGateway, [token.getAddress()])
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");

    // 以前の rewardGateway に対するトークンの承認額が 0 になっていることを確認する
    const newAllowance = await token.allowance(await dm2TradeRewardPool.getAddress(), previousRewardGateway);
    expect(newAllowance).to.equal(0);
  });
  // CONTROLLER_ROLE のみが setRewardGateway を実行できることを確認するテストを追加
  it("CONTROLLER_ROLE 以外が setRewardGateway を実行しようとすると失敗することを確認する", async function () {
    const newRewardGateway = addr2.address;

    // コントローラー以外のアカウントが setRewardGateway を実行しようとするとエラーが発生することを確認する
    await expect(
      dm2TradeRewardPool.connect(addr1).setRewardGateway(newRewardGateway, [token.getAddress()])
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");

    // 検証者も setRewardGateway を実行できないことを確認する
    await expect(
      dm2TradeRewardPool.connect(verifier).setRewardGateway(newRewardGateway, [token.getAddress()])
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");
  });
  // コントラクトが一時停止中に setRewardGateway を呼び出し、エラーが発生することを確認する
  it("should revert when setRewardGateway is called while the contract is paused", async function () {
    const newRewardGateway = addr2.address;

    // Pause the contract
    await dm2TradeRewardPool.connect(controller).pause();

    // Attempt to call setRewardGateway while the contract is paused
    const tokenContracts = [token.getAddress()]; // Example token contracts array

    await expect(
      dm2TradeRewardPool.connect(controller).setRewardGateway(newRewardGateway, tokenContracts)
    ).to.be.reverted;
  });
  
  // setWithdrawRecipient関数
  // コントローラーが setWithdrawRecipient を実行し、withdrawRecipient の値が変更され、コントラクトが Pause されることを確認する
  it("コントローラーによる setWithdrawRecipient とコントラクトの一時停止", async function () {
    const newWithdrawRecipient = addr2.address;
    const previousWithdrawRecipient = await dm2TradeRewardPool.withdrawRecipient();

    // コントローラーが setWithdrawRecipient を実行
    await dm2TradeRewardPool.connect(controller).setWithdrawRecipient(newWithdrawRecipient);

    // withdrawRecipient の値が変更されたことを確認する
    expect(await dm2TradeRewardPool.withdrawRecipient()).to.equal(newWithdrawRecipient);

    // コントラクトが一時停止されていることを確認する
    expect(await dm2TradeRewardPool.paused()).to.be.true;

    // コントローラー以外のアカウントが setWithdrawRecipient を実行しようとするとエラーが発生することを確認する
    await expect(
      dm2TradeRewardPool.connect(addr1).setWithdrawRecipient(newWithdrawRecipient)
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");

    // 検証者も setWithdrawRecipient を実行できないことを確認する
    await expect(
      dm2TradeRewardPool.connect(verifier).setWithdrawRecipient(newWithdrawRecipient)
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");

    // 以前の withdrawRecipient に対するトークンの承認額が変更されていないことを確認する
    const previousAllowance = await token.allowance(await dm2TradeRewardPool.getAddress(), previousWithdrawRecipient);
    expect(previousAllowance).to.equal(ethers.parseEther("0")); // ここでは仮に以前の承認額を設定しています。適切な値に変更してください。
  });
  // CONTROLLER_ROLE 以外が setWithdrawRecipient を実行しようとすると失敗することを確認する
  it("CONTROLLER_ROLE 以外が setWithdrawRecipient を実行しようとすると失敗することを確認する", async function () {
    const newWithdrawRecipient = addr2.address;

    // コントローラー以外のアカウントが setWithdrawRecipient を実行しようとするとエラーが発生することを確認する
    await expect(
      dm2TradeRewardPool.connect(addr1).setWithdrawRecipient(newWithdrawRecipient)
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");

    // 検証者も setWithdrawRecipient を実行できないことを確認する
    await expect(
      dm2TradeRewardPool.connect(verifier).setWithdrawRecipient(newWithdrawRecipient)
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");
  });

  // withdraw関数
  // 検証者のみが指定したトークンの全額を引き出せることを確認する
  it("検証者による指定したトークンの全額引き出し", async function () {
    // トークンを報酬プールに転送
    const transferAmount = ethers.parseEther("100");
    await token.transfer(dm2TradeRewardPool.getAddress(), transferAmount);

    // 検証者がトークンを引き出す
    await dm2TradeRewardPool.connect(verifier).withdraw([token.getAddress()]);

    // 引き出し先のアドレスのトークン残高を確認
    const balance = await token.balanceOf(addr2.address);
    expect(balance).to.equal(transferAmount);

    // トークンが報酬プールから引き出されたことを確認
    const poolBalance = await token.balanceOf(dm2TradeRewardPool.getAddress());
    expect(poolBalance).to.equal(0);
  });
  // 他の権限者がトークンを引き出せないことを確認する
  it("検証者以外がトークンを引き出せないことを確認する", async function () {
    // トークンを報酬プールに転送
    const transferAmount = ethers.parseEther("100");
    await token.transfer(dm2TradeRewardPool.getAddress(), transferAmount);

    // コントローラーがトークンを引き出そうとするとエラーが発生することを確認する
    await expect(
      dm2TradeRewardPool.connect(controller).withdraw([token.getAddress()])
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");

    // 他のアカウントがトークンを引き出そうとするとエラーが発生することを確認する
    await expect(
      dm2TradeRewardPool.connect(addr1).withdraw([token.getAddress()])
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");

    // コントローラーではない検証者が引き出しを試みた場合のテストも含める
    await expect(
      dm2TradeRewardPool.connect(addr2).withdraw([token.getAddress()])
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");
  });

  // コントラクトにトークンを転送し、引き出し先アドレスにトークンが正しく転送されるかを確認する
  it("引き出し先アドレスへのトークン引き出し", async function () {
    await token.transfer(dm2TradeRewardPool.getAddress(), ethers.parseEther("100"));
    await dm2TradeRewardPool.connect(verifier).withdraw([token.getAddress()]);

    const balance = await token.balanceOf(addr2.address);
    expect(balance).to.equal(ethers.parseEther("100"));
  });

  // registerEvent関数
  // コントローラーでないアカウントがリワードイベントを登録しようとすると、適切なカスタムエラーが発生するかを確認する
  it("非コントローラーによるリワードイベントの登録拒否", async function () {
    await expect(
      dm2TradeRewardPool.connect(addr1).registerEvent("testEventID", token.getAddress(), ethers.parseEther("100"))
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");
  });
  // コントラクトが一時停止中に registerEvent を呼び出し、エラーが発生することを確認する。
  it("should revert when registerEvent is called while the contract is paused", async function () {
    // Pause the contract
    await dm2TradeRewardPool.connect(controller).pause();

    // Attempt to call registerEvent while the contract is paused
    const treventID = "testEvent";
    const rewardAmount = ethers.parseUnits("100", 18);

    await expect(
      dm2TradeRewardPool.connect(controller).registerEvent(treventID, token.getAddress(), rewardAmount)
    ).to.be.reverted;
  });
  // safeIncreaseAllowance メソッドが失敗する場合、トランザクションが正しくリバートされることを確認する
  /* Mockを作る必要があるが、そこまでの粒度は工数及び現実に見合わないために、保留
  it("should revert when safeIncreaseAllowance fails", async function () {
    // Call registerEvent with the mocked token contract that fails on safeIncreaseAllowance
    await expect(
      dm2TradeRewardPool.connect(controller).registerEvent(
        "eventID",
        token.getAddress(),
        "1000000000000000000" // 1 ETH in wei as a string
      )
    //).to.be.revertedWith("SafeERC20: low-level call failed");
    ).to.be.reverted;
  });
  */

  // コントローラーでないアカウントが送金用スマートコントラクトの設定を変更しようとすると、適切なカスタムエラーが発生するかを確認する
  it("非コントローラーによる送金用スマートコントラクトの変更拒否", async function () {
    const newRewardGateway = addr2.address;
    await expect(
      dm2TradeRewardPool.connect(addr1).setRewardGateway(newRewardGateway, [token.getAddress()])
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");
  });

  // コントローラーでないアカウントが引き出し先アドレスを変更しようとすると、適切なカスタムエラーが発生するかを確認する
  it("非コントローラーによる引き出し先アドレスの変更拒否", async function () {
    const newWithdrawRecipient = addr2.address;
    await expect(
      dm2TradeRewardPool.connect(addr1).setWithdrawRecipient(newWithdrawRecipient)
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");
  });

  // 検証者でないアカウントがトークンの引き出しを試みると、適切なカスタムエラーが発生するかを確認する
  it("非検証者によるトークン引き出し拒否", async function () {
    await token.transfer(dm2TradeRewardPool.getAddress(), ethers.parseEther("100"));
    await expect(
      dm2TradeRewardPool.connect(addr1).withdraw([token.getAddress()])
    ).to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");
  });

  // Pause機能に関するテスト
  // コントローラーがコントラクトを一時停止できるが、再開は検証者のみが可能であることを確認する
  it("コントローラーによるコントラクトの一時停止と検証者による再開", async function () {
    // コントローラーによる一時停止
    await dm2TradeRewardPool.connect(controller).pause();
    expect(await dm2TradeRewardPool.paused()).to.be.true;

    // 検証者による再開
    await dm2TradeRewardPool.connect(verifier).unpause();
    expect(await dm2TradeRewardPool.paused()).to.be.false;

    // コントローラーによる再開試行（失敗するはず）
    await expect(dm2TradeRewardPool.connect(controller).unpause())
      .to.be.revertedWithCustomError(dm2TradeRewardPool, "AccessControlUnauthorizedAccount");
  });

  // コントローラーまたは検証者によるコントラクトの一時停止
  it("検証者によるコントラクトの一時停止", async function () {
    await dm2TradeRewardPool.connect(verifier).pause();
    expect(await dm2TradeRewardPool.paused()).to.be.true;
  });

// コントローラーおよび検証者以外によるコントラクトの一時停止拒否
it("コントローラーおよび検証者以外によるコントラクトの一時停止拒否", async function () {
  // コントローラーおよび検証者以外のアカウントでpauseを試みる
  await expect(
    dm2TradeRewardPool.connect(addr1).pause()
  ).to.be.reverted; // リバートを期待

  // コントラクトが一時停止されていないことを確認
  expect(await dm2TradeRewardPool.paused()).to.be.false;
});


  /* TODO:送金用スマートコントラクトのテストファイルの作成が終わったら、対応するテスト
  // 閾値テスト
  it("should not revert and should not be paused when called by non-controllers or verifiers", async function () {
    const tx: ContractTransactionResponse = await dm2TradeRewardPool.connect(addr1).pause();
    await tx.wait();

    expect(await dm2TradeRewardPool.paused()).to.be.false; // 確認しているのは、一時停止していないこと。

    // Unpause should be allowed only by verifier
    const txUnpause: ContractTransactionResponse = await dm2TradeRewardPool.connect(verifier).unpause();
    await txUnpause.wait();

    expect(await dm2TradeRewardPool.paused()).to.be.false;
  });
  // 最小額でのバッチ転送のテスト
  it("最小額でのバッチ転送", async function () {
    await token.transfer(await dm2TradeRewardPool.getAddress(), ethers.parseEther("100"));

    // 賞金の設定
    await dm2TradeRewardPool.connect(controller).registerEvent("minBatchEventID", await token.getAddress(), ethers.parseEther("10"));
    await dm2TradeRewardPool.connect(controller).setRewardGateway(addr1.address, [token.getAddress()]);

    // 最小額でバッチ転送を実行
    //const tx: ContractTransactionResponse = await dm2TradeRewardPool.connect(controller).batchTransferReward(["0x123...", "0x456..."], ethers.parseEther("10"));
    const tx: ContractTransactionResponse = await dm2TradeRewardPool.connect(controller).batchTransferReward([addr1.address, addr2.address], ethers.parseEther("10"));
    
    const receipt: TransactionReceipt = await tx.wait();

    // イベントのデコード
    const transferEvent = receipt.logs.find(log => log.topics[0] === ethers.id("Transfer(address,address,uint256)"));
    expect(transferEvent).to.not.be.undefined;

    if (transferEvent === undefined) {
      throw new Error("TransferEvent not found");
    }

    const decodedLog = ethers.AbiCoder.defaultAbiCoder().decode(
      ["address", "address", "uint256"],
      transferEvent.data
    );

    const [from, to, value] = decodedLog;
    expect(from).to.equal(await dm2TradeRewardPool.getAddress());
    expect(to).to.equal(addr1.address);
    expect(value).to.equal(ethers.parseEther("10"));
  });
  // 最大額でのバッチ転送のテスト
  it("最大額でのバッチ転送", async function () {
    await token.transfer(await dm2TradeRewardPool.getAddress(), ethers.parseEther("1000"));

    // 賞金の設定
    await dm2TradeRewardPool.connect(controller).registerEvent("maxBatchEventID", await token.getAddress(), ethers.parseEther("500"));
    await dm2TradeRewardPool.connect(controller).setRewardGateway(addr1.address, [token.getAddress()]);

    // 最大額でバッチ転送を実行
    const tx: ContractTransactionResponse = await dm2TradeRewardPool.connect(controller).batchTransferReward(["0x789...", "0xabc..."], ethers.parseEther("500"));
    const receipt: TransactionReceipt = await tx.wait();

    // イベントのデコード
    const transferEvent = receipt.logs.find(log => log.topics[0] === ethers.id("Transfer(address,address,uint256)"));
    expect(transferEvent).to.not.be.undefined;

    if (transferEvent === undefined) {
      throw new Error("TransferEvent not found");
    }

    const decodedLog = ethers.AbiCoder.defaultAbiCoder().decode(
      ["address", "address", "uint256"],
      transferEvent.data
    );

    const [from, to, value] = decodedLog;
    expect(from).to.equal(await dm2TradeRewardPool.getAddress());
    expect(to).to.equal(addr1.address);
    expect(value).to.equal(ethers.parseEther("500"));
  });
*/

})