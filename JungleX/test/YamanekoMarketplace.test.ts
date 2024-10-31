import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
import { toBytes } from "viem";
import {
  VoucherReqType,
  VoucherType,
  VoucherResType,
  PermitVoucherReqType,
  PermitVoucherType,
  PermitVoucherResType,
  ApproveVoucherReqType,
  ApproveVoucherType,
} from "./test.dto";

async function deployFixture() {
  // SBT
  const YamanekoSBT = await ethers.getContractFactory("YamanekoSBT");
  const yamanekoSBT = await upgrades.deployProxy(YamanekoSBT, [], {
    kind: "uups",
  });
  await yamanekoSBT.deployed();

  // NFT
  const YamanekoNFT = await ethers.getContractFactory("YamanekoNFT");
  const yamanekoNFT = await upgrades.deployProxy(
    YamanekoNFT,
    [yamanekoSBT.address],
    {
      kind: "uups",
    }
  );
  await yamanekoNFT.deployed();

  // Marketplace
  const YamanekoMarketplace = await ethers.getContractFactory(
    "YamanekoMarketplace"
  );
  const yamanekoMarketplace = await upgrades.deployProxy(
    YamanekoMarketplace,
    [],
    {
      kind: "uups",
    }
  );
  await yamanekoMarketplace.deployed();

  // Token
  const JungleToken = await ethers.getContractFactory("JungleToken");
  const jungleToken = await JungleToken.deploy();
  await jungleToken.deployed();

  const [admin, minter, burner, setter, buyer, signer, pauser, ...other] =
    await ethers.getSigners();

  // SBT権限付与
  await yamanekoSBT.grantRole(yamanekoSBT.ADMIN_ROLE(), admin.address);
  await yamanekoSBT.grantRole(yamanekoSBT.MINTER_ROLE(), minter.address);
  await yamanekoSBT.grantRole(yamanekoSBT.SETTER_ROLE(), setter.address);
  // yamanekoNFTにもsetter権限を付与
  await yamanekoSBT.grantRole(yamanekoSBT.SETTER_ROLE(), yamanekoNFT.address);
  // NFT権限付与
  await yamanekoNFT.grantRole(yamanekoNFT.ADMIN_ROLE(), admin.address);
  await yamanekoNFT.grantRole(yamanekoNFT.MINTER_ROLE(), minter.address);
  await yamanekoNFT.grantRole(yamanekoNFT.BURNER_ROLE(), burner.address);
  await yamanekoNFT.grantRole(yamanekoNFT.SETTER_ROLE(), setter.address);
  // Marketplace権限付与
  await yamanekoMarketplace.grantRole(
    yamanekoMarketplace.ADMIN_ROLE(),
    admin.address
  );
  await yamanekoMarketplace.grantRole(
    yamanekoMarketplace.BUYER_ROLE(),
    buyer.address
  );
  // Token権限付与
  await jungleToken.grantRole(jungleToken.MINTER_ROLE(), minter.address);
  await jungleToken.grantRole(jungleToken.PAUSER_ROLE(), pauser.address);

  // Merketplaceの設定
  await yamanekoNFT.setMarketplaceAddress(yamanekoMarketplace.address);
  await yamanekoMarketplace.setNFTContract(yamanekoNFT.address);
  await yamanekoMarketplace.setPaymentToken(jungleToken.address);
  await yamanekoMarketplace.setMarketSignerAddress(signer.address);

  return {
    yamanekoSBT,
    yamanekoNFT,
    yamanekoMarketplace,
    jungleToken,
    admin,
    minter,
    burner,
    setter,
    buyer,
    pauser,
    signer,
    other,
  };
}

describe("YamanekoMarketplace Contract", function () {
  describe("Deployment", function () {
    it("should set the right owner", async function () {
      const { yamanekoMarketplace, admin } = await loadFixture(deployFixture);
      expect(await yamanekoMarketplace.owner()).to.equal(admin.address);
    });

    it("should assign the default admin role to the deployer", async function () {
      const { yamanekoMarketplace } = await loadFixture(deployFixture);
      expect(
        await yamanekoMarketplace.hasRole(
          await yamanekoMarketplace.DEFAULT_ADMIN_ROLE(),
          yamanekoMarketplace.owner()
        )
      ).to.be.true;
    });

    it("should assign the admin role to the deployer", async function () {
      const { yamanekoMarketplace } = await loadFixture(deployFixture);
      expect(
        await yamanekoMarketplace.hasRole(
          await yamanekoMarketplace.ADMIN_ROLE(),
          yamanekoMarketplace.owner()
        )
      ).to.be.true;
    });

    it("creatorFee initial value is 5000000", async function () {
      const { yamanekoMarketplace } = await loadFixture(deployFixture);
      expect(await yamanekoMarketplace.creatorFee()).to.equal(5000000);
    });

    it("platformFee initial value is 5000000", async function () {
      const { yamanekoMarketplace } = await loadFixture(deployFixture);
      expect(await yamanekoMarketplace.platformFee()).to.equal(5000000);
    });
  });

  describe("Access Control", function () {
    describe("ADMIN_ROLE", function () {
      it("should only allow ADMIN_ROLE:setNFTContract", async function () {
        const { yamanekoMarketplace, yamanekoNFT, admin, other } =
          await loadFixture(deployFixture);

        // ADMIN_ROLEを持たないアドレスがsetNFTContractを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoMarketplace
            .connect(other[0])
            .setNFTContract(yamanekoNFT.address)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetNFTContractを呼び出せることを確認
        await expect(
          yamanekoMarketplace.connect(admin).setNFTContract(yamanekoNFT.address)
        ).to.not.be.reverted;
        expect(await yamanekoMarketplace.nftContract()).to.equal(
          yamanekoNFT.address
        );
      });

      it("should only allow ADMIN_ROLE:setPaymentToken", async function () {
        const { yamanekoMarketplace, jungleToken, admin, other } =
          await loadFixture(deployFixture);

        // ADMIN_ROLEを持たないアドレスがsetPaymentTokenを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoMarketplace
            .connect(other[0])
            .setPaymentToken(jungleToken.address)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetPaymentTokenを呼び出せることを確認
        await expect(
          yamanekoMarketplace
            .connect(admin)
            .setPaymentToken(jungleToken.address)
        ).to.not.be.reverted;
        expect(await yamanekoMarketplace.paymentToken()).to.equal(
          jungleToken.address
        );
      });

      it("should only allow ADMIN_ROLE:setMarketSignerAddress", async function () {
        const { yamanekoMarketplace, signer, admin, other } = await loadFixture(
          deployFixture
        );

        // ADMIN_ROLEを持たないアドレスがsetMarketSignerAddressを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoMarketplace
            .connect(other[0])
            .setMarketSignerAddress(signer.address)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetMarketSignerAddressを呼び出せることを確認
        await expect(
          yamanekoMarketplace
            .connect(admin)
            .setMarketSignerAddress(signer.address)
        ).to.not.be.reverted;
        expect(await yamanekoMarketplace.marketSignerAddress()).to.equal(
          signer.address
        );
      });

      it("should only allow ADMIN_ROLE:setCreatorFeePercentage", async function () {
        const { yamanekoMarketplace, admin, other } = await loadFixture(
          deployFixture
        );

        // ADMIN_ROLEを持たないアドレスがsetCreatorFeePercentageを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoMarketplace.connect(other[0]).setCreatorFeePercentage(10)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetCreatorFeePercentageを呼び出せることを確認
        await expect(
          yamanekoMarketplace.connect(admin).setCreatorFeePercentage(10)
        ).to.not.be.reverted;
        expect(await yamanekoMarketplace.creatorFee()).to.equal(10);
      });

      it("should only allow ADMIN_ROLE:setPlatformFeePercentage", async function () {
        const { yamanekoMarketplace, admin, other } = await loadFixture(
          deployFixture
        );

        // ADMIN_ROLEを持たないアドレスがsetPlatformFeePercentageを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoMarketplace.connect(other[0]).setPlatformFeePercentage(10)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetPlatformFeePercentageを呼び出せることを確認
        await expect(
          yamanekoMarketplace.connect(admin).setPlatformFeePercentage(10)
        ).to.not.be.reverted;
        expect(await yamanekoMarketplace.platformFee()).to.equal(10);
      });
    });

    describe("OWNER_ROLE", function () {
      it("should only allow OWNER:withdrawProceeds", async function () {
        const { yamanekoMarketplace, jungleToken, admin, other } =
          await loadFixture(deployFixture);

        // 引き出しテスト用に独自トークンをミントしておく
        await expect(
          jungleToken.connect(admin).mint(yamanekoMarketplace.address, 1)
        ).to.not.be.reverted;

        // OWNER_ROLEを持たないアドレスがwithdrawProceedsを呼び出した場合にエラーになることを確認
        await expect(yamanekoMarketplace.connect(other[0]).withdrawProceeds())
          .to.be.reverted;

        // OWNER_ROLEのみがwithdrawProceedsを呼び出せることを確認
        await expect(yamanekoMarketplace.connect(admin).withdrawProceeds()).to
          .not.be.reverted;
      });
    });
  });

  describe("buyNFT", function () {
    it("should buy NFT", async function () {
      const {
        yamanekoNFT,
        yamanekoMarketplace,
        jungleToken,
        admin,
        minter,
        buyer,
        other,
        signer,
      } = await loadFixture(deployFixture);

      // アドレス設定
      const userSeller = other[0];
      const userBuyer = other[1];
      const userCreater = other[2];

      const tokenId = 1;
      const contentsId = 1;
      const uri = "https://example.com";
      const nftPrice = ethers.utils.parseEther("0.005"); // 0.005ETH で価格を設定
      const VALID_PRICE = 5000000000000000; // 0.005 ETH
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 86400; // 1日後のタイムスタンプ

      // NFTのミント
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(userSeller.address, tokenId, contentsId, uri)
      ).to.not.be.reverted;

      // マーケットプレイスへの転送許可
      const approveVoucher = await createSetApprovalForAllVoucher({
        signer: userSeller,
        nftContract: yamanekoNFT.address,
        owner: userSeller.address,
        operator: yamanekoMarketplace.address,
        approved: true,
        nonce: 0,
        deadline: deadline,
      });
      await expect(yamanekoNFT.connect(admin).approvalPermit(approveVoucher)).to
        .not.be.reverted;

      // 独自トークンのミント（このトークンを使ってNFT購入する）
      await expect(
        jungleToken.connect(minter).mint(userBuyer.address, nftPrice)
      ).to.not.be.reverted;

      // マーケットプレイス署名（運営ウォレットによる署名）
      const voucher = await createMarketItemVoucher({
        marketContract: yamanekoMarketplace,
        signer: signer,
        buyer: userBuyer.address,
        seller: userSeller.address,
        creator: userCreater.address,
        tokenId: tokenId,
        contentsId: contentsId,
        price: VALID_PRICE,
        nonce: 0,
      });

      // パーミットの生成（userBuyerによる署名）
      const permit = await createPermitVoucher({
        signer: userBuyer,
        tokenContract: jungleToken.address,
        owner: userBuyer.address,
        spender: yamanekoMarketplace.address,
        value: VALID_PRICE,
        nonce: 0,
        deadline: deadline,
      });

      // NFTを購入
      await expect(yamanekoMarketplace.connect(buyer).buyNFT(voucher, permit))
        .to.emit(yamanekoMarketplace, "PurchaseEvent")
        .withArgs(
          userBuyer.address,
          userSeller.address,
          userCreater.address,
          tokenId,
          contentsId,
          nftPrice,
          buyer.address
        );

      // 所有者の検証
      expect(await yamanekoNFT.ownerOf(tokenId)).to.equal(userBuyer.address);

      // バランスの検証
      const platformFee = VALID_PRICE * 0.05;
      const createrFee = VALID_PRICE * 0.05;
      const sellerSaleAmount = VALID_PRICE - platformFee - createrFee;
      expect(await jungleToken.balanceOf(userBuyer.address)).to.equal(0);
      expect(await jungleToken.balanceOf(yamanekoMarketplace.address)).to.equal(
        platformFee
      );
      expect(await jungleToken.balanceOf(userCreater.address)).to.equal(
        createrFee
      );
      expect(await jungleToken.balanceOf(userSeller.address)).to.equal(
        sellerSaleAmount
      );

      // プラットフォームフィーのWithdrawの検証
      const adminPreBalance: BigNumber = await jungleToken.balanceOf(
        admin.address
      );
      expect(await yamanekoMarketplace.connect(admin).withdrawProceeds()).to.not
        .be.reverted;
      const adminPostBalance: BigNumber = await jungleToken.balanceOf(
        admin.address
      );
      const balanceDiff = adminPostBalance.sub(adminPreBalance);
      expect(balanceDiff).to.equal(platformFee);
    });

    it("Invalid buyer address", async function () {
      const {
        yamanekoNFT,
        yamanekoMarketplace,
        jungleToken,
        admin,
        minter,
        buyer,
        other,
        signer,
      } = await loadFixture(deployFixture);

      // アドレス設定
      const userSeller = other[0];
      const userBuyer = other[1];
      const userCreater = other[2];

      const tokenId = 1;
      const contentsId = 1;
      const uri = "https://example.com";
      const nftPrice = ethers.utils.parseEther("0.005"); // 0.005ETH で価格を設定
      const VALID_PRICE = 5000000000000000; // 0.005 ETH
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 86400; // 1日後のタイムスタンプ

      // NFTのミント
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(userSeller.address, tokenId, contentsId, uri)
      ).to.not.be.reverted;

      // マーケットプレイスへの転送許可
      const approveVoucher = await createSetApprovalForAllVoucher({
        signer: userSeller,
        nftContract: yamanekoNFT.address,
        owner: userSeller.address,
        operator: yamanekoMarketplace.address,
        approved: true,
        nonce: 0,
        deadline: deadline,
      });
      await expect(yamanekoNFT.connect(admin).approvalPermit(approveVoucher)).to
        .not.be.reverted;

      // 独自トークンのミント（このトークンを使ってNFT購入する）
      await expect(
        jungleToken.connect(minter).mint(userBuyer.address, nftPrice)
      ).to.not.be.reverted;

      // マーケットプレイス署名（運営ウォレットによる署名）- buyerアドレスを不正にする
      const voucher = await createMarketItemVoucher({
        marketContract: yamanekoMarketplace,
        signer: signer,
        buyer: userSeller.address,
        seller: userSeller.address,
        creator: userCreater.address,
        tokenId: tokenId,
        contentsId: contentsId,
        price: VALID_PRICE,
        nonce: 0,
      });

      // パーミットの生成（userBuyerによる署名）
      const permit = await createPermitVoucher({
        signer: userBuyer,
        tokenContract: jungleToken.address,
        owner: userBuyer.address,
        spender: yamanekoMarketplace.address,
        value: VALID_PRICE,
        nonce: 0,
        deadline: deadline,
      });

      // NFTを購入
      await expect(
        yamanekoMarketplace.connect(buyer).buyNFT(voucher, permit)
      ).to.revertedWith("Invalid buyer address");
    });

    it("Signature already used", async function () {
      const {
        yamanekoNFT,
        yamanekoMarketplace,
        jungleToken,
        admin,
        minter,
        buyer,
        other,
        signer,
      } = await loadFixture(deployFixture);

      // アドレス設定
      const userSeller = other[0];
      const userBuyer = other[1];
      const userCreater = other[2];

      const tokenId = 1;
      const contentsId = 1;
      const uri = "https://example.com";
      const nftPrice = ethers.utils.parseEther("0.005"); // 0.005ETH で価格を設定
      const VALID_PRICE = 5000000000000000; // 0.005 ETH
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 86400; // 1日後のタイムスタンプ

      // NFTのミント
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(userSeller.address, tokenId, contentsId, uri)
      ).to.not.be.reverted;

      // マーケットプレイスへの転送許可
      const approveVoucher = await createSetApprovalForAllVoucher({
        signer: userSeller,
        nftContract: yamanekoNFT.address,
        owner: userSeller.address,
        operator: yamanekoMarketplace.address,
        approved: true,
        nonce: 0,
        deadline: deadline,
      });
      await expect(yamanekoNFT.connect(admin).approvalPermit(approveVoucher)).to
        .not.be.reverted;

      // 独自トークンのミント（このトークンを使ってNFT購入する）
      await expect(
        jungleToken.connect(minter).mint(userBuyer.address, nftPrice)
      ).to.not.be.reverted;

      // マーケットプレイス署名（運営ウォレットによる署名）
      const voucher = await createMarketItemVoucher({
        marketContract: yamanekoMarketplace,
        signer: signer,
        buyer: userBuyer.address,
        seller: userSeller.address,
        creator: userCreater.address,
        tokenId: tokenId,
        contentsId: contentsId,
        price: VALID_PRICE,
        nonce: 0,
      });

      // パーミットの生成（userBuyerによる署名）
      const permit = await createPermitVoucher({
        signer: userBuyer,
        tokenContract: jungleToken.address,
        owner: userBuyer.address,
        spender: yamanekoMarketplace.address,
        value: VALID_PRICE,
        nonce: 0,
        deadline: deadline,
      });

      // NFTを購入
      await expect(yamanekoMarketplace.connect(buyer).buyNFT(voucher, permit))
        .to.emit(yamanekoMarketplace, "PurchaseEvent")
        .withArgs(
          userBuyer.address,
          userSeller.address,
          userCreater.address,
          tokenId,
          contentsId,
          nftPrice,
          buyer.address
        );

      // 所有者の検証
      expect(await yamanekoNFT.ownerOf(tokenId)).to.equal(userBuyer.address);

      // 同じ署名でNFTを購入
      await expect(
        yamanekoMarketplace.connect(buyer).buyNFT(voucher, permit)
      ).rejectedWith("Signature already used");
    });

    it("Invalid seller address", async function () {
      const {
        yamanekoNFT,
        yamanekoMarketplace,
        jungleToken,
        admin,
        minter,
        buyer,
        other,
        signer,
      } = await loadFixture(deployFixture);

      // アドレス設定
      const userSeller = other[0];
      const userBuyer = other[1];
      const userCreater = other[2];
      const userSeller2 = other[3];

      const tokenId = 1;
      const contentsId = 1;
      const uri = "https://example.com";
      const nftPrice = ethers.utils.parseEther("0.005"); // 0.005ETH で価格を設定
      const VALID_PRICE = 5000000000000000; // 0.005 ETH
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 86400; // 1日後のタイムスタンプ

      // NFTのミント
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(userSeller2.address, tokenId, contentsId, uri)
      ).to.not.be.reverted;

      // マーケットプレイスへの転送許可
      const approveVoucher = await createSetApprovalForAllVoucher({
        signer: userSeller2,
        nftContract: yamanekoNFT.address,
        owner: userSeller2.address,
        operator: yamanekoMarketplace.address,
        approved: true,
        nonce: 0,
        deadline: deadline,
      });
      await expect(yamanekoNFT.connect(admin).approvalPermit(approveVoucher)).to
        .not.be.reverted;

      // 独自トークンのミント（このトークンを使ってNFT購入する）
      await expect(
        jungleToken.connect(minter).mint(userBuyer.address, nftPrice)
      ).to.not.be.reverted;

      // マーケットプレイス署名（運営ウォレットによる署名）
      const voucher = await createMarketItemVoucher({
        marketContract: yamanekoMarketplace,
        signer: signer,
        buyer: userBuyer.address,
        seller: userSeller.address,
        creator: userCreater.address,
        tokenId: tokenId,
        contentsId: contentsId,
        price: VALID_PRICE,
        nonce: 0,
      });

      // パーミットの生成（userBuyerによる署名）
      const permit = await createPermitVoucher({
        signer: userBuyer,
        tokenContract: jungleToken.address,
        owner: userBuyer.address,
        spender: yamanekoMarketplace.address,
        value: VALID_PRICE,
        nonce: 0,
        deadline: deadline,
      });

      // NFTを購入
      await expect(
        yamanekoMarketplace.connect(buyer).buyNFT(voucher, permit)
      ).to.revertedWith("Invalid seller address");
    });

    it("This NFT has SBT set", async function () {
      const {
        yamanekoNFT,
        yamanekoSBT,
        yamanekoMarketplace,
        jungleToken,
        admin,
        minter,
        buyer,
        other,
        signer,
      } = await loadFixture(deployFixture);

      // アドレス設定
      const userSeller = other[0];
      const userBuyer = other[1];
      const userCreater = other[2];

      const tokenId = 1;
      const contentsId = 1;
      const uri = "https://example.com";
      const nftPrice = ethers.utils.parseEther("0.005"); // 0.005ETH で価格を設定
      const VALID_PRICE = 5000000000000000; // 0.005 ETH
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 86400; // 1日後のタイムスタンプ

      // NFTのミント
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(userSeller.address, tokenId, contentsId, uri)
      ).to.not.be.reverted;

      // マーケットプレイスへの転送許可
      const approveVoucher = await createSetApprovalForAllVoucher({
        signer: userSeller,
        nftContract: yamanekoNFT.address,
        owner: userSeller.address,
        operator: yamanekoMarketplace.address,
        approved: true,
        nonce: 0,
        deadline: deadline,
      });
      await expect(yamanekoNFT.connect(admin).approvalPermit(approveVoucher)).to
        .not.be.reverted;

      // 独自トークンのミント（このトークンを使ってNFT購入する）
      await expect(
        jungleToken.connect(minter).mint(userBuyer.address, nftPrice)
      ).to.not.be.reverted;

      // SBTのミントと装着
      await expect(
        yamanekoSBT.connect(minter).mint(userSeller.address, contentsId)
      ).to.not.be.reverted;

      await expect(
        yamanekoNFT
          .connect(admin)
          .setSBTonNFT(userSeller.address, tokenId, contentsId)
      ).to.not.be.reverted;

      // マーケットプレイス署名（運営ウォレットによる署名）
      const voucher = await createMarketItemVoucher({
        marketContract: yamanekoMarketplace,
        signer: signer,
        buyer: userBuyer.address,
        seller: userSeller.address,
        creator: userCreater.address,
        tokenId: tokenId,
        contentsId: contentsId,
        price: VALID_PRICE,
        nonce: 0,
      });

      // パーミットの生成（userBuyerによる署名）
      const permit = await createPermitVoucher({
        signer: userBuyer,
        tokenContract: jungleToken.address,
        owner: userBuyer.address,
        spender: yamanekoMarketplace.address,
        value: VALID_PRICE,
        nonce: 0,
        deadline: deadline,
      });

      // NFTを購入
      await expect(
        yamanekoMarketplace.connect(buyer).buyNFT(voucher, permit)
      ).to.revertedWith("This NFT has SBT set");
    });

    it("Invalid signature", async function () {
      const {
        yamanekoNFT,
        yamanekoSBT,
        yamanekoMarketplace,
        jungleToken,
        admin,
        minter,
        buyer,
        other,
        signer,
      } = await loadFixture(deployFixture);

      // アドレス設定
      const userSeller = other[0];
      const userBuyer = other[1];
      const userCreater = other[2];

      const tokenId = 1;
      const contentsId = 1;
      const uri = "https://example.com";
      const nftPrice = ethers.utils.parseEther("0.005"); // 0.005ETH で価格を設定
      const VALID_PRICE = 5000000000000000; // 0.005 ETH
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 86400; // 1日後のタイムスタンプ

      // NFTのミント
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(userSeller.address, tokenId, contentsId, uri)
      ).to.not.be.reverted;

      // マーケットプレイスへの転送許可
      const approveVoucher = await createSetApprovalForAllVoucher({
        signer: userSeller,
        nftContract: yamanekoNFT.address,
        owner: userSeller.address,
        operator: yamanekoMarketplace.address,
        approved: true,
        nonce: 0,
        deadline: deadline,
      });
      await expect(yamanekoNFT.connect(admin).approvalPermit(approveVoucher)).to
        .not.be.reverted;

      // 独自トークンのミント（このトークンを使ってNFT購入する）
      await expect(
        jungleToken.connect(minter).mint(userBuyer.address, nftPrice)
      ).to.not.be.reverted;

      // マーケットプレイス署名（運営ウォレットによる署名）
      const voucher = await createMarketItemVoucher({
        marketContract: yamanekoMarketplace,
        signer: admin, //invalid
        buyer: userBuyer.address,
        seller: userSeller.address,
        creator: userCreater.address,
        tokenId: tokenId,
        contentsId: contentsId,
        price: VALID_PRICE,
        nonce: 0,
      });

      // パーミットの生成（userBuyerによる署名）
      const permit = await createPermitVoucher({
        signer: userBuyer,
        tokenContract: jungleToken.address,
        owner: userBuyer.address,
        spender: yamanekoMarketplace.address,
        value: VALID_PRICE,
        nonce: 0,
        deadline: deadline,
      });

      // NFTを購入
      await expect(
        yamanekoMarketplace.connect(buyer).buyNFT(voucher, permit)
      ).to.revertedWith("Invalid signature");
    });

    it("Token Permit Invalid signature", async function () {
      const {
        yamanekoNFT,
        yamanekoSBT,
        yamanekoMarketplace,
        jungleToken,
        admin,
        minter,
        buyer,
        other,
        signer,
      } = await loadFixture(deployFixture);

      // アドレス設定
      const userSeller = other[0];
      const userBuyer = other[1];
      const userCreater = other[2];

      const tokenId = 1;
      const contentsId = 1;
      const uri = "https://example.com";
      const nftPrice = ethers.utils.parseEther("0.005"); // 0.005ETH で価格を設定
      const VALID_PRICE = 5000000000000000; // 0.005 ETH
      const deadline =
        (await ethers.provider.getBlock("latest")).timestamp + 86400; // 1日後のタイムスタンプ

      // NFTのミント
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(userSeller.address, tokenId, contentsId, uri)
      ).to.not.be.reverted;

      // マーケットプレイスへの転送許可
      const approveVoucher = await createSetApprovalForAllVoucher({
        signer: userSeller,
        nftContract: yamanekoNFT.address,
        owner: userSeller.address,
        operator: yamanekoMarketplace.address,
        approved: true,
        nonce: 0,
        deadline: deadline,
      });
      await expect(yamanekoNFT.connect(admin).approvalPermit(approveVoucher)).to
        .not.be.reverted;

      // 独自トークンのミント（このトークンを使ってNFT購入する）
      await expect(
        jungleToken.connect(minter).mint(userBuyer.address, nftPrice)
      ).to.not.be.reverted;

      // マーケットプレイス署名（運営ウォレットによる署名）
      const voucher = await createMarketItemVoucher({
        marketContract: yamanekoMarketplace,
        signer: signer,
        buyer: userBuyer.address,
        seller: userSeller.address,
        creator: userCreater.address,
        tokenId: tokenId,
        contentsId: contentsId,
        price: VALID_PRICE,
        nonce: 0,
      });

      // パーミットの生成（userBuyerによる署名）
      const permit = await createPermitVoucher({
        signer: signer, //invalid
        tokenContract: jungleToken.address,
        owner: userBuyer.address,
        spender: yamanekoMarketplace.address,
        value: VALID_PRICE,
        nonce: 0,
        deadline: deadline,
      });

      // NFTを購入
      await expect(yamanekoMarketplace.connect(buyer).buyNFT(voucher, permit))
        .to.be.reverted;
    });
  });

  // setApprovalForAll署名の生成
  async function createSetApprovalForAllVoucher({
    signer,
    nftContract,
    owner,
    operator,
    approved,
    nonce,
    deadline,
  }: ApproveVoucherReqType): Promise<ApproveVoucherType> {
    const domain = {
      name: "Yamaneko-Voucher",
      version: "1",
      verifyingContract: `0x${nftContract.substring(2)}`,
      chainId: 31337,
    } as const;

    const voucher: ApproveVoucherType = {
      owner: `0x${owner.substring(2)}`,
      operator: `0x${operator.substring(2)}`,
      approved: approved,
      nonce: nonce,
      deadline: deadline,
    };

    const types = {
      setApprovalForAll: [
        { name: "owner", type: "address" },
        { name: "operator", type: "address" },
        { name: "approved", type: "bool" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const signature = await (signer as any)._signTypedData(
      domain,
      types,
      voucher
    );

    const data = {
      ...voucher,
      signature: toBytes(signature),
    };

    return data;
  }

  // マーケットプレイス署名の生成
  async function createMarketItemVoucher({
    marketContract,
    signer,
    buyer,
    seller,
    creator,
    tokenId,
    contentsId,
    price,
    nonce,
  }: VoucherReqType): Promise<VoucherResType> {
    const domain = {
      name: "Yamaneko-Voucher",
      version: "1",
      verifyingContract: marketContract.address,
      chainId: 31337,
    } as const;

    const voucher: VoucherType = {
      buyer: `0x${buyer.substring(2)}`,
      seller: `0x${seller.substring(2)}`,
      creator: `0x${creator.substring(2)}`,
      tokenId: tokenId,
      contentsId: contentsId,
      price: price,
      nonce: nonce,
    };

    const types = {
      MarketItemVoucher: [
        { name: "buyer", type: "address" },
        { name: "seller", type: "address" },
        { name: "creator", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "contentsId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const signature = await (signer as any)._signTypedData(
      domain,
      types,
      voucher
    );

    const data = {
      ...voucher,
      signature: toBytes(signature),
    };

    return data;
  }

  // パーミット署名の生成
  async function createPermitVoucher({
    signer,
    tokenContract,
    owner,
    spender,
    value,
    nonce,
    deadline,
  }: PermitVoucherReqType): Promise<PermitVoucherResType> {
    const domain = {
      name: "JungleToken",
      version: "1",
      verifyingContract: `0x${tokenContract.substring(2)}`,
      chainId: 31337,
    } as const;

    const voucher: PermitVoucherType = {
      owner: `0x${owner.substring(2)}`,
      spender: `0x${spender.substring(2)}`,
      value: value,
      nonce: nonce,
      deadline: deadline,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const signature = await (signer as any)._signTypedData(
      domain,
      types,
      voucher
    );
    const { v, r, s } = ethers.utils.splitSignature(signature);

    const data = {
      owner: voucher.owner,
      value: voucher.value,
      deadline: voucher.deadline,
      v,
      r,
      s,
    };

    return data;
  }
});
