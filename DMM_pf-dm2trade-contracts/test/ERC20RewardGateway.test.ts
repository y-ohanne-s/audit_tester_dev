import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { ERC20Mock, DM2TradeRewardPool, ERC20RewardGateway } from "../typechain-types";

describe("ERC20RewardGateway Tests", function () {
  let deployer: Signer;
  let operator: Signer;
  let verifier: Signer;
  let DM2TradeRewardPool: DM2TradeRewardPool;
  let erc20RewardGateway: ERC20RewardGateway;
  let token: ERC20Mock;

  let owner: Signer;
  let controller: Signer;
  let addr1: Signer;
  let addr2: Signer;

  const initialBalance = ethers.parseUnits("10000", 18); // 10000 トークン
  const approveAmount = ethers.parseUnits("1000", 18);  // 1000 トークン
  const transferAmount = ethers.parseUnits("1500", 18); // 1500 トークン

  beforeEach(async function () {
    [deployer, owner, verifier, controller, operator, addr1, addr2] = await ethers.getSigners();

    // ERC20Mock トークンをデプロイ
    const ERC20MockFactory = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20MockFactory.deploy("Mock Token", "MTK", ethers.parseUnits("100000", 18));

    // ERC20RewardGateway コントラクトをデプロイ
    const ERC20RewardGatewayFactory = await ethers.getContractFactory("ERC20RewardGateway");
    erc20RewardGateway = await ERC20RewardGatewayFactory.deploy(verifier.getAddress(), controller.getAddress(), operator.getAddress()) as ERC20RewardGateway;
    
    // RewardPool コントラクトをデプロイ
    const RewardPoolFactory = await ethers.getContractFactory("DM2TradeRewardPool");
    DM2TradeRewardPool = await RewardPoolFactory.deploy(
      erc20RewardGateway.getAddress(),
      await deployer.getAddress(), // _withdrawRecipient
      await controller.getAddress(),
      await verifier.getAddress()
    ) as DM2TradeRewardPool;
    
    // トークンを RewardPool コントラクトに送信
    await token.transfer(DM2TradeRewardPool.getAddress(), initialBalance);

    // RewardPool コントラクトが ERC20RewardGateway コントラクトに対してトークンを承認
    await DM2TradeRewardPool.connect(controller).registerEvent(
      "event1",
      token.getAddress(),
      ethers.parseEther("10")
    );
  });

  // 初期設定
  it("should correctly deploy and set roles", async function () {
    // コントラクトが正しくデプロイされ、役割が適切に設定されていることを確認する
    expect(await erc20RewardGateway.hasRole(await erc20RewardGateway.VERIFIER_ROLE(), verifier.getAddress())).to.be.true;
    expect(await erc20RewardGateway.hasRole(await erc20RewardGateway.CONTROLLER_ROLE(), controller.getAddress())).to.be.true;
    expect(await erc20RewardGateway.hasRole(await erc20RewardGateway.OPERATOR_ROLE(), operator.getAddress())).to.be.true;
  });

  // transferReward関数
  // 送金処理
  it("should transfer reward correctly", async function () {
    await token.transfer(DM2TradeRewardPool.getAddress(), ethers.parseEther("100"));
    
    const claimIdHash = ethers.keccak256(ethers.toUtf8Bytes("claim1"));

    await erc20RewardGateway.connect(operator).transferReward(
      token.getAddress(),
      DM2TradeRewardPool.getAddress(),
      addr1.getAddress(),
      ethers.parseEther("10"),
      claimIdHash
    );

    const balance = await token.balanceOf(addr1.getAddress());
    expect(balance).to.equal(ethers.parseEther("10"));
  });
  // 重複するクレームIDの処理
  it("should emit TransferSkip event on duplicate claim ID", async function () {

    await token.transfer(DM2TradeRewardPool.getAddress(), ethers.parseEther("100"));
    
    const claimIdHash = ethers.keccak256(ethers.toUtf8Bytes("claim1"));

    // 初回の送金処理
    await erc20RewardGateway.connect(operator).transferReward(
      token.getAddress(),
      DM2TradeRewardPool.getAddress(),
      addr1.getAddress(),
      ethers.parseEther("10"),
      claimIdHash
    );

    // 重複するクレームIDでの送金処理
    await expect(
      erc20RewardGateway.connect(operator).transferReward(
        token.getAddress(),
        DM2TradeRewardPool.getAddress(),
        addr1.getAddress(),
        ethers.parseEther("10"),
        claimIdHash
      )
    ).to.emit(erc20RewardGateway, "TransferSkip").withArgs(claimIdHash, addr1.getAddress(), ethers.parseEther("10"));
  });

  // batchTransferReward関数
  // バッチ転送
  it("should batch transfer rewards correctly", async function () {
    await token.transfer(DM2TradeRewardPool.getAddress(), ethers.parseEther("100"));

    const claimIdHash1 = ethers.keccak256(ethers.toUtf8Bytes("claim1"));
    const claimIdHash2 = ethers.keccak256(ethers.toUtf8Bytes("claim2"));

    //`batchTransferReward` が正しく実行され、複数のリワードが指定されたアドレスに転送されること
    await erc20RewardGateway.connect(operator).batchTransferReward(
      token.getAddress(),
      DM2TradeRewardPool.getAddress(),
      [addr1.getAddress(), addr2.getAddress()],
      [ethers.parseEther("5"), ethers.parseEther("5")],
      [claimIdHash1, claimIdHash2]
    );

    const balance1 = await token.balanceOf(addr1.getAddress());
    const balance2 = await token.balanceOf(addr2.getAddress());
    expect(balance1).to.equal(ethers.parseEther("5"));
    expect(balance2).to.equal(ethers.parseEther("5"));
  });
  // 配列長の不一致
  it("should revert on array length mismatch", async function () {
    await token.transfer(DM2TradeRewardPool.getAddress(), ethers.parseEther("100"));

    const claimIdHash1 = ethers.keccak256(ethers.toUtf8Bytes("claim1"));

    // `_to`, `_amount`, `_claimIdHash` の配列長が不一致の場合に、`ArrayLengthMismatch` エラーが発生すること
    await expect(
      erc20RewardGateway.connect(operator).batchTransferReward(
        token.getAddress(),
        DM2TradeRewardPool.getAddress(),
        [addr1.getAddress()],
        [ethers.parseEther("10"), ethers.parseEther("10")],
        [claimIdHash1]
      )
    ).to.be.revertedWithCustomError(erc20RewardGateway, "ArrayLengthMismatch");
  });

  // 非オペレーターによる転送の拒否
  it("should not allow non-operator to transfer reward", async function () {
    const claimIdHash = ethers.keccak256(ethers.toUtf8Bytes("claim1"));
    await expect(
      erc20RewardGateway.connect(addr1).transferReward(
        token.getAddress(),
        DM2TradeRewardPool.getAddress(),
        addr1.getAddress(),
        ethers.parseEther("10"),
        claimIdHash
      )
    ).to.be.revertedWithCustomError(erc20RewardGateway, "AccessControlUnauthorizedAccount");
  });

  // 非オペレーターによるバッチ転送の拒否
  it("should not allow non-operator to batch transfer rewards", async function () {
    const claimIdHash1 = ethers.keccak256(ethers.toUtf8Bytes("claim1"));
    const claimIdHash2 = ethers.keccak256(ethers.toUtf8Bytes("claim2"));
    await expect(
      erc20RewardGateway.connect(addr1).batchTransferReward(
        token.getAddress(),
        DM2TradeRewardPool.getAddress(),
        [addr1.getAddress(), addr2.getAddress()],
        [ethers.parseEther("10"), ethers.parseEther("10")],
        [claimIdHash1, claimIdHash2]
      )
    ).to.be.revertedWithCustomError(erc20RewardGateway, "AccessControlUnauthorizedAccount");
  });

  // Pause関数
  // ポーズ機能
  it("should not allow non-verifier to pause the contract", async function () {
    await expect(
      erc20RewardGateway.connect(addr1).pause()
    ).to.be.revertedWith("Caller is not a controller or verifier");
  });

  it("should allow verifier to pause and unpause the contract", async function () {
    await erc20RewardGateway.connect(verifier).pause();
    expect(await erc20RewardGateway.paused()).to.be.true;

    await erc20RewardGateway.connect(verifier).unpause();
    expect(await erc20RewardGateway.paused()).to.be.false;
  });

  /* 検討中
  // クレームIDの管理
  it("should correctly set and check claim IDs", async function () {
    const claimIdHash = ethers.keccak256(ethers.toUtf8Bytes("claim1"));

    await token.transfer(DM2TradeRewardPool.address, ethers.parseEther("100"));

    await erc20RewardGateway.connect(operator).transferReward(
      token.getAddress(),
      DM2TradeRewardPool.address,
      addr1.address,
      ethers.parseEther("10"),
      claimIdHash
    );

    expect(await erc20RewardGateway.transactedClaimIdHash(claimIdHash)).to.be.true;
  });
  */

  // 送金額が残高を超えた場合に、適切なエラーが発生すること
  it("should revert if transfer amount exceeds balance", async function () {
    await token.transfer(DM2TradeRewardPool.getAddress(), ethers.parseEther("10"));

    const claimIdHash = ethers.keccak256(ethers.toUtf8Bytes("claim1"));

    await expect(
      erc20RewardGateway.connect(operator).transferReward(
        token.getAddress(),
        DM2TradeRewardPool.getAddress(),
        addr1.getAddress(),
        ethers.parseEther("20"),
        claimIdHash
      )
    ).to.be.reverted;
  });
  // 不正なトークンアドレスや無効なアドレスの場合に、適切なエラーが発生すること
  it("should revert on invalid token address", async function () {
    const AddressZero = '0x0000000000000000000000000000000000000000';
    const invalidTokenAddress = AddressZero;
    const claimIdHash = ethers.keccak256(ethers.toUtf8Bytes("claim1"));

    await expect(
      erc20RewardGateway.connect(operator).transferReward(
        invalidTokenAddress,
        DM2TradeRewardPool.getAddress(),
        addr1.getAddress(),
        ethers.parseEther("10"),
        claimIdHash
      )
    ).to.be.reverted;
  });

  // DEFAULT_ADMIN_ROLEの存在しないことを確認
  it("should not have DEFAULT_ADMIN_ROLE", async function () {
    // DEFAULT_ADMIN_ROLE の役割 ID を取得します（通常、デフォルトの Admin Role は固定の役割 ID を持っている場合がありますが、ここでは確認のために使用しています）
    const defaultAdminRole = await erc20RewardGateway.DEFAULT_ADMIN_ROLE();

    // デフォルトの Admin Role の役割を確認します
    const isAdminRolePresent = await erc20RewardGateway.hasRole(defaultAdminRole, owner.getAddress());

    // デフォルトの Admin Role が存在しないことを確認します
    expect(isAdminRolePresent).to.be.false;
  });

  // 結合テスト：報酬プール用スマートコントラクトが送金用スマートコントラクトに承認した額を超えて、送金用スマートコントラクトが transferできないことを確認する
  it("should revert when attempting to transfer more tokens than approved", async function () {
    const claimIdHash = ethers.keccak256(ethers.toUtf8Bytes("testClaimId"));

    await expect(
        erc20RewardGateway.connect(operator).transferReward(
            token.getAddress(),
            DM2TradeRewardPool.getAddress(),
            await operator.getAddress(),
            transferAmount,
            claimIdHash
        )
    //).to.be.revertedWith("SafeERC20: low-level call failed");
    ).to.be.reverted;
  });

  // 結合テスト：バッチ転送が承認された額を超えて転送しようとした場合にリバートすることを確認
  it("should revert when attempting to batch transfer more tokens than approved", async function () {
    const claimIdHash1 = ethers.keccak256(ethers.toUtf8Bytes("claim1"));
    const claimIdHash2 = ethers.keccak256(ethers.toUtf8Bytes("claim2"));

    await expect(
        erc20RewardGateway.connect(operator).batchTransferReward(
            token.getAddress(),
            DM2TradeRewardPool.getAddress(),
            [await operator.getAddress(), await operator.getAddress()],
            [transferAmount, transferAmount],
            [claimIdHash1, claimIdHash2]
        )
    ).to.be.reverted;
  });
});
