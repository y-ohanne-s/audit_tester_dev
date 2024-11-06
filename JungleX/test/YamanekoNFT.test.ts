import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

async function deployFixture() {
  const YamanekoSBT = await ethers.getContractFactory("YamanekoSBT");
  const yamanekoSBT = await upgrades.deployProxy(YamanekoSBT, [], {
    kind: "uups",
  });

  await yamanekoSBT.deployed();

  const YamanekoNFT = await ethers.getContractFactory("YamanekoNFT");
  const yamanekoNFT = await upgrades.deployProxy(
    YamanekoNFT,
    [yamanekoSBT.address],
    {
      kind: "uups",
    }
  );

  await yamanekoNFT.deployed();

  const [admin, minter, burner, setter, ...other] = await ethers.getSigners();

  await yamanekoSBT.grantRole(yamanekoSBT.ADMIN_ROLE(), admin.address);
  await yamanekoSBT.grantRole(yamanekoSBT.MINTER_ROLE(), minter.address);
  await yamanekoSBT.grantRole(yamanekoSBT.SETTER_ROLE(), setter.address);
  // yamanekoNFTにもsetter権限を付与
  await yamanekoSBT.grantRole(yamanekoSBT.SETTER_ROLE(), yamanekoNFT.address);

  await yamanekoNFT.grantRole(yamanekoNFT.ADMIN_ROLE(), admin.address);
  await yamanekoNFT.grantRole(yamanekoNFT.MINTER_ROLE(), minter.address);
  await yamanekoNFT.grantRole(yamanekoNFT.BURNER_ROLE(), burner.address);
  await yamanekoNFT.grantRole(yamanekoNFT.SETTER_ROLE(), setter.address);

  return { yamanekoSBT, yamanekoNFT, admin, minter, burner, setter, other };
}

describe("YamanekoNFT Contract", function () {
  describe("Deployment", function () {
    it("name initial value is Yamaneko", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.name()).to.equal("Yamaneko");
    });

    it("symbol initial value is YNK", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.symbol()).to.equal("YNK");
    });

    it("should set the right owner", async function () {
      const { yamanekoNFT, admin } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.owner()).to.equal(admin.address);
    });

    it("should assign the default admin role to the deployer", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(
        await yamanekoNFT.hasRole(
          await yamanekoNFT.DEFAULT_ADMIN_ROLE(),
          yamanekoNFT.owner()
        )
      ).to.be.true;
    });

    it("should assign the admin role to the deployer", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(
        await yamanekoNFT.hasRole(
          await yamanekoNFT.ADMIN_ROLE(),
          yamanekoNFT.owner()
        )
      ).to.be.true;
    });

    it("should assign the minter role to the deployer", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(
        await yamanekoNFT.hasRole(
          await yamanekoNFT.MINTER_ROLE(),
          yamanekoNFT.owner()
        )
      ).to.be.true;
    });

    it("should assign the burner role to the deployer", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(
        await yamanekoNFT.hasRole(
          await yamanekoNFT.BURNER_ROLE(),
          yamanekoNFT.owner()
        )
      ).to.be.true;
    });

    it("should assign the setter role to the deployer", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(
        await yamanekoNFT.hasRole(
          await yamanekoNFT.SETTER_ROLE(),
          yamanekoNFT.owner()
        )
      ).to.be.true;
    });

    it("Should set the right SBT address", async function () {
      const { yamanekoNFT, yamanekoSBT } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.sbtAddress()).to.equal(yamanekoSBT.address);
    });

    it("Should set the right marketplace address", async function () {
      const { yamanekoNFT, admin } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.marketplaceAddress()).to.equal(
        ethers.constants.AddressZero
      );
    });
  });
  describe("Access Control", function () {
    describe("ADMIN_ROLE", function () {
      it("should only allow ADMIN_ROLE:setSBTAddress", async function () {
        const { yamanekoNFT, admin, other } = await loadFixture(deployFixture);

        // ADMIN_ROLEを持たないアドレスがsetSBTAddressを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoNFT.connect(other[0]).setSBTAddress(other[0].address)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetSBTAddressを呼び出せることを確認
        await expect(yamanekoNFT.connect(admin).setSBTAddress(other[0].address))
          .to.not.be.reverted;
        expect(await yamanekoNFT.sbtAddress()).to.equal(other[0].address);
      });
      it("should only allow ADMIN_ROLE:setMarketplaceAddress", async function () {
        const { yamanekoNFT, admin, other } = await loadFixture(deployFixture);

        // ADMIN_ROLEを持たないアドレスがsetMarketplaceAddressを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoNFT.connect(other[0]).setMarketplaceAddress(other[0].address)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetMarketplaceAddressを呼び出せることを確認
        await expect(
          yamanekoNFT.connect(admin).setMarketplaceAddress(other[0].address)
        ).to.not.be.reverted;
        expect(await yamanekoNFT.marketplaceAddress()).to.equal(
          other[0].address
        );
      });
    });

    describe("MINTER_ROLE", function () {
      it("should only allow MINTER_ROLE:mint", async function () {
        const { yamanekoNFT, minter, other } = await loadFixture(deployFixture);

        // MINTER_ROLEを持たないアドレスがmintを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoNFT
            .connect(other[0])
            .mint(other[0].address, 1, 1, "https://test.com/1.json")
        ).to.be.revertedWith("Caller is not a minter");

        // MINTER_ROLEのみがmintを呼び出せることを確認
        await expect(
          yamanekoNFT
            .connect(minter)
            .mint(other[0].address, 1, 1, "https://test.com/1.json")
        ).to.not.be.reverted;
        expect(await yamanekoNFT.balanceOf(other[0].address)).to.equal(1);
      });
    });

    describe("BURNER_ROLE", function () {
      it("should only allow BURNER_ROLE:burn", async function () {
        const { yamanekoNFT, minter, burner, other } = await loadFixture(
          deployFixture
        );

        await yamanekoNFT
          .connect(minter)
          .mint(other[0].address, 1, 1, "https://test.com/1.json");
        expect(await yamanekoNFT.balanceOf(other[0].address)).to.equal(1);

        // BURNER_ROLEを持たないアドレスがburnを呼び出した場合にエラーになることを確認
        await expect(yamanekoNFT.connect(other[0]).burn(1)).to.be.revertedWith(
          "Caller is not a burner"
        );

        // BURNER_ROLEのみがburnを呼び出せることを確認
        await expect(yamanekoNFT.connect(burner).burn(1)).to.not.be.reverted;
        expect(await yamanekoNFT.balanceOf(other[0].address)).to.equal(0);
      });
    });

    describe("SETTER_ROLE", function () {
      it("should only allow SETTER_ROLE:setSBTonNFT", async function () {
        const { yamanekoSBT, yamanekoNFT, minter, setter, other } =
          await loadFixture(deployFixture);

        await yamanekoSBT.connect(minter).mint(other[0].address, 1);
        await expect(
          yamanekoNFT
            .connect(minter)
            .mint(other[0].address, 1, 1, "https://test.com/1.json")
        ).to.not.be.reverted;
        expect(await yamanekoNFT.balanceOf(other[0].address)).to.equal(1);

        // SETTER_ROLEを持たないアドレスがsetSBTonNFTを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoNFT.connect(other[0]).setSBTonNFT(other[0].address, 1, 1)
        ).to.be.revertedWith("Caller is not a setter");

        // SETTER_ROLEのみがsetSBTonNFTを呼び出せることを確認
        await expect(
          yamanekoNFT.connect(setter).setSBTonNFT(other[0].address, 1, 1)
        ).to.not.be.reverted;
        expect(
          await yamanekoNFT.getSBTonBattleNFT(other[0].address, 1)
        ).to.equal(1);
      });

      it("should only allow SETTER_ROLE:removeSBTonNFT", async function () {
        const { yamanekoSBT, yamanekoNFT, minter, setter, other } =
          await loadFixture(deployFixture);

        await yamanekoSBT.connect(minter).mint(other[0].address, 1);
        await expect(
          yamanekoNFT
            .connect(minter)
            .mint(other[0].address, 1, 1, "https://test.com/1.json")
        ).to.not.be.reverted;

        await yamanekoNFT.connect(setter).setSBTonNFT(other[0].address, 1, 1);
        expect(
          await yamanekoNFT.getSBTonBattleNFT(other[0].address, 1)
        ).to.equal(1);

        await expect(
          yamanekoNFT.connect(other[0]).removeSBTonNFT(other[0].address, 1)
        ).to.be.reverted;

        await expect(
          yamanekoNFT.connect(setter).removeSBTonNFT(other[0].address, 1)
        ).to.not.be.reverted;
      });
    });
  });

  describe("mint", function () {
    it("tokenId already exists", async function () {
      const { yamanekoSBT, yamanekoNFT, minter, other } = await loadFixture(
        deployFixture
      );
      await yamanekoSBT.connect(minter).mint(other[0].address, 1);

      await yamanekoNFT
        .connect(minter)
        .mint(other[0].address, 1, 1, "https://test.com/1.json");
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(other[0].address, 1, 1, "https://test.com/1.json")
      ).to.be.revertedWith("tokenId already exists");
    });

    it("to is not 0 address", async function () {
      const { yamanekoSBT, yamanekoNFT, minter, other } = await loadFixture(
        deployFixture
      );
      await yamanekoSBT.connect(minter).mint(other[0].address, 1);

      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(ethers.constants.AddressZero, 1, 1, "https://test.com/1.json")
      ).to.be.revertedWith("to is not 0 address");
    });

    it("Normal pattern to replace SBT", async function () {
      const { yamanekoSBT, yamanekoNFT, minter, setter, other } =
        await loadFixture(deployFixture);

      await yamanekoSBT.connect(minter).mint(other[0].address, 1);
      // 1つ目のNFTを発行
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(other[0].address, 1, 1, "https://test.com/1.json")
      ).to.not.be.reverted;

      // 2つ目のNFTを発行
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(other[0].address, 2, 1, "https://test.com/2.json")
      ).to.not.be.reverted;

      // 1つ目のNFTにSBTをセット
      await expect(
        yamanekoNFT.connect(setter).setSBTonNFT(other[0].address, 1, 1)
      ).to.not.be.reverted;
      expect(await yamanekoNFT.getSBTonBattleNFT(other[0].address, 1)).to.equal(
        1
      );

      // SBTがセットされていると転送できない
      await expect(
        yamanekoNFT
          .connect(other[0])
          .transferFrom(other[0].address, other[2].address, 1)
      ).to.be.reverted;

      // SBTをセットしていないNFTは転送できる
      await expect(
        yamanekoNFT
          .connect(other[0])
          .transferFrom(other[0].address, other[2].address, 2)
      ).to.not.be.reverted;

      // 保有していないNFTはSBTをセットできない
      await expect(
        yamanekoNFT.connect(setter).setSBTonNFT(other[0].address, 2, 1)
      ).to.be.reverted;
    });

    // It takes a long time!!!
    // it("should mint tokens to 10,000 contentId", async function () {
    //   this.timeout(0); // Disable timeout as this will take a long time
    //   const { yamanekoNFT, yamanekoSBT, minter, setter, other } =
    //     await loadFixture(deployFixture);
    //   await yamanekoSBT.connect(minter).mint(other[0].address, 1);

    //   for (let i = 1; i <= 10000; i++) {
    //     await expect(
    //       yamanekoNFT
    //         .connect(minter)
    //         .mint(other[0].address, i, 1, "https://test.com/1.json")
    //     ).to.not.be.reverted;
    //   }
    //   expect(await yamanekoNFT.balanceOf(other[0].address)).to.equal(10000);
    // });
  });

  describe("SupportsInterface function", function () {
    it("-should support ERC721 interface", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.supportsInterface("0x01ffc9a7")).to.be.true; // 0x01ffc9a7 is the interface ID for ERC165
    });

    it("-should support ERC721 interface", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.supportsInterface("0x80ac58cd")).to.be.true; // 0x80ac58cd is the interface ID for ERC721
    });

    it("-should support ERC721 interface", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.supportsInterface("0x5b5e139f")).to.be.true; // 0x5b5e139f is the interface ID for ERC721Metadata
    });

    it("-should support AccessControl interface", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.supportsInterface("0x7965db0b")).to.be.true; // 0x7965db0b is the interface ID for AccessControl
    });

    it("-should not support random interface", async function () {
      const { yamanekoNFT } = await loadFixture(deployFixture);
      expect(await yamanekoNFT.supportsInterface("0x12345678")).to.be.false; // Random interface ID
    });
  });

  describe("YAMANEKO Can only be Approved by Makepeople", function () {
    it("should only allow Makepeople:approve", async function () {
      const { yamanekoSBT, yamanekoNFT, admin, minter, setter, other } =
        await loadFixture(deployFixture);

      await yamanekoNFT.connect(admin).setMarketplaceAddress(other[1].address);

      await yamanekoSBT.connect(minter).mint(other[0].address, 1);
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(other[0].address, 1, 1, "https://test.com/1.json")
      ).to.not.be.reverted;

      await expect(yamanekoNFT.connect(other[0]).approve(other[2].address, 1))
        .to.be.reverted;

      await expect(yamanekoNFT.connect(other[0]).approve(other[1].address, 1))
        .to.not.be.reverted;
    });
  });

  describe("TransferFrom is not possible if NFT is loading SBT", function () {
    it("should only allow Makepeople:approve", async function () {
      const { yamanekoSBT, yamanekoNFT, admin, minter, setter, other } =
        await loadFixture(deployFixture);

      await yamanekoSBT.connect(minter).mint(other[0].address, 1);
      await expect(
        yamanekoNFT
          .connect(minter)
          .mint(other[0].address, 1, 1, "https://test.com/1.json")
      ).to.not.be.reverted;

      await yamanekoNFT.connect(setter).setSBTonNFT(other[0].address, 1, 1);

      await expect(
        yamanekoNFT
          .connect(other[0])
          .transferFrom(other[0].address, other[2].address, 1)
      ).to.be.reverted;

      await yamanekoNFT.connect(setter).removeSBTonNFT(other[0].address, 1);

      await expect(
        yamanekoNFT
          .connect(other[0])
          .transferFrom(other[0].address, other[2].address, 1)
      ).to.not.be.reverted;
    });
  });
});
