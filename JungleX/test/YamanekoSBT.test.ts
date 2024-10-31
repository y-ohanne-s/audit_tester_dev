import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

async function deployYamanekoSBTFixture() {
  const YamanekoSBT = await ethers.getContractFactory("YamanekoSBT");
  const yamanekoSBT = await upgrades.deployProxy(YamanekoSBT, [], {
    kind: "uups",
  });

  await yamanekoSBT.deployed();

  const [admin, minter, setter, other] = await ethers.getSigners();

  await yamanekoSBT.grantRole(yamanekoSBT.ADMIN_ROLE(), admin.address);
  await yamanekoSBT.grantRole(yamanekoSBT.MINTER_ROLE(), minter.address);
  await yamanekoSBT.grantRole(yamanekoSBT.SETTER_ROLE(), setter.address);

  return { yamanekoSBT, admin, minter, setter, other };
}

describe("YamanekoSBT Contract", function () {
  describe("Deployment", function () {
    it("name initial value is Yamaneko-SBT", async function () {
      const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
      expect(await yamanekoSBT.name()).to.equal("Yamaneko-SBT");
    });

    it("symbol initial value is YNKSBT", async function () {
      const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
      expect(await yamanekoSBT.symbol()).to.equal("YNKSBT");
    });

    it("should set the right owner", async function () {
      const { yamanekoSBT, admin } = await loadFixture(
        deployYamanekoSBTFixture
      );
      expect(await yamanekoSBT.owner()).to.equal(admin.address);
    });

    it("should assign the default admin role to the deployer", async function () {
      const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
      expect(
        await yamanekoSBT.hasRole(
          await yamanekoSBT.DEFAULT_ADMIN_ROLE(),
          yamanekoSBT.owner()
        )
      ).to.be.true;
    });

    it("should assign the admin role to the deployer", async function () {
      const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
      expect(
        await yamanekoSBT.hasRole(
          await yamanekoSBT.ADMIN_ROLE(),
          yamanekoSBT.owner()
        )
      ).to.be.true;
    });

    it("should assign the minter role to the deployer", async function () {
      const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
      expect(
        await yamanekoSBT.hasRole(
          await yamanekoSBT.MINTER_ROLE(),
          yamanekoSBT.owner()
        )
      ).to.be.true;
    });

    it("should assign the setter role to the deployer", async function () {
      const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
      expect(
        await yamanekoSBT.hasRole(
          await yamanekoSBT.SETTER_ROLE(),
          yamanekoSBT.owner()
        )
      ).to.be.true;
    });

    it("tokenIdCnt initial value is 1", async function () {
      const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
      expect(await yamanekoSBT.tokenIdCnt()).to.equal(1);
    });

    it("baseExtension initial value is .json", async function () {
      const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
      expect(await yamanekoSBT.baseExtension()).to.equal(".json");
    });
  });
  describe("Access Control", function () {
    describe("ADMIN_ROLE", function () {
      it("should only allow ADMIN_ROLE:setSwitchURI", async function () {
        const { yamanekoSBT, admin, other } = await loadFixture(
          deployYamanekoSBTFixture
        );

        // ADMIN_ROLEを持たないアドレスがsetSwitchURIを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoSBT.connect(other).setSwitchURI(1)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetSwitchURIを呼び出せることを確認
        await expect(yamanekoSBT.connect(admin).setSwitchURI(1)).to.not.be
          .reverted;
        expect(await yamanekoSBT.switchURI()).to.equal(1);
      });
      it("should only allow ADMIN_ROLE:setTokenURI", async function () {
        const { yamanekoSBT, admin, other } = await loadFixture(
          deployYamanekoSBTFixture
        );

        // ADMIN_ROLEを持たないアドレスがsetTokenURIを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoSBT.connect(other).setTokenURI(other.address)
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetTokenURIを呼び出せることを確認
        await expect(yamanekoSBT.connect(admin).setTokenURI(other.address)).to
          .not.be.reverted;
        expect(await yamanekoSBT.tokenuri()).to.equal(other.address);
      });
      it("should only allow ADMIN_ROLE:setBaseURI", async function () {
        const { yamanekoSBT, admin, other } = await loadFixture(
          deployYamanekoSBTFixture
        );

        // ADMIN_ROLEを持たないアドレスがsetBaseURIを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoSBT.connect(other).setBaseURI("https://example.com")
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetBaseURIを呼び出せることを確認
        await expect(
          yamanekoSBT.connect(admin).setBaseURI("https://example.com")
        ).to.not.be.reverted;
        expect(await yamanekoSBT.baseURI()).to.equal("https://example.com");
      });

      it("should only allow ADMIN_ROLE:setFixMetadata", async function () {
        const { yamanekoSBT, admin, other } = await loadFixture(
          deployYamanekoSBTFixture
        );

        // ADMIN_ROLEを持たないアドレスがpauseを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoSBT
            .connect(other)
            .setFixMetadata("https://example.com/1.json")
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがpauseを呼び出せることを確認
        await expect(
          yamanekoSBT
            .connect(admin)
            .setFixMetadata("https://example.com/1.json")
        ).to.not.be.reverted;
        expect(await yamanekoSBT.fixMetadata()).to.equal(
          "https://example.com/1.json"
        );
      });

      it("should only allow ADMIN_ROLE:setBaseExtension", async function () {
        const { yamanekoSBT, admin, other } = await loadFixture(
          deployYamanekoSBTFixture
        );

        // ADMIN_ROLEを持たないアドレスがsetBaseExtensionを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoSBT.connect(other).setBaseExtension(".xml")
        ).to.be.revertedWith("Caller is not a admin");

        // ADMIN_ROLEのみがsetBaseExtensionを呼び出せることを確認
        await expect(yamanekoSBT.connect(admin).setBaseExtension(".xml")).to.not
          .be.reverted;
        expect(await yamanekoSBT.baseExtension()).to.equal(".xml");
      });
    });

    //SetterRole
    describe("SETTER_ROLE", function () {
      it("should only allow SETTER_ROLE:setTokenBattleNFT", async function () {
        const { yamanekoSBT, minter, setter, other } = await loadFixture(
          deployYamanekoSBTFixture
        );

        await expect(yamanekoSBT.connect(minter).mint(other.address, 1)).to.not
          .be.reverted;

        // SETTER_ROLEを持たないアドレスがsetTokenBattleNFTを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoSBT.connect(other).setTokenBattleNFT(1, 10)
        ).to.be.revertedWith("Caller is not a setter");

        // SETTER_ROLEのみがsetTokenBattleNFTを呼び出せることを確認
        await expect(yamanekoSBT.connect(setter).setTokenBattleNFT(1, 10)).to
          .not.be.reverted;
        expect(await yamanekoSBT.getBattleNFT(1)).to.equal(10);
      });
    });

    //MinterRole
    describe("MINTER_ROLE", function () {
      it("should only allow MINTER_ROLE:mint", async function () {
        const { yamanekoSBT, minter, other } = await loadFixture(
          deployYamanekoSBTFixture
        );

        // MINTER_ROLEを持たないアドレスがmintを呼び出した場合にエラーになることを確認
        await expect(
          yamanekoSBT.connect(other).mint(other.address, 1)
        ).to.be.revertedWith("Caller is not a minter");

        // MINTER_ROLEのみがmintを呼び出せることを確認
        await expect(yamanekoSBT.connect(minter).mint(other.address, 1)).to.not
          .be.reverted;
        expect(await yamanekoSBT.balanceOf(other.address)).to.equal(1);
      });
    });
  });

  describe("SBT", function () {
    describe("Approval and Transfer Restriction Tests", function () {
      it("should not allow approve", async function () {
        const { yamanekoSBT, minter, other } = await loadFixture(
          deployYamanekoSBTFixture
        );
        await expect(yamanekoSBT.connect(minter).mint(other.address, 1)).to.not
          .be.reverted;
        await expect(
          yamanekoSBT.connect(other).approve(other.address, 1)
        ).to.be.revertedWith("This token is SBT");
      });

      it("should not allow transfer", async function () {
        const { yamanekoSBT, admin, minter, other } = await loadFixture(
          deployYamanekoSBTFixture
        );
        await expect(yamanekoSBT.connect(minter).mint(other.address, 1)).to.not
          .be.reverted;
        await expect(
          yamanekoSBT
            .connect(other)
            .transferFrom(other.address, admin.address, 1)
        ).to.be.revertedWith("Token is not transferable");
      });
    });

    describe("SupportsInterface function", function () {
      it("-should support ERC721 interface", async function () {
        const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
        expect(await yamanekoSBT.supportsInterface("0x01ffc9a7")).to.be.true; // 0x01ffc9a7 is the interface ID for ERC165
      });

      it("-should support ERC721 interface", async function () {
        const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
        expect(await yamanekoSBT.supportsInterface("0x80ac58cd")).to.be.true; // 0x80ac58cd is the interface ID for ERC721
      });

      it("-should support ERC721 interface", async function () {
        const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
        expect(await yamanekoSBT.supportsInterface("0x5b5e139f")).to.be.true; // 0x5b5e139f is the interface ID for ERC721Metadata
      });

      it("-should support AccessControl interface", async function () {
        const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
        expect(await yamanekoSBT.supportsInterface("0x7965db0b")).to.be.true; // 0x7965db0b is the interface ID for AccessControl
      });

      it("-should not support random interface", async function () {
        const { yamanekoSBT } = await loadFixture(deployYamanekoSBTFixture);
        expect(await yamanekoSBT.supportsInterface("0x12345678")).to.be.false; // Random interface ID
      });
    });
  });

  describe("mint", function () {
    it("Cannot mint if content ID is the same in the same wallet", async function () {
      const { yamanekoSBT, minter, other } = await loadFixture(
        deployYamanekoSBTFixture
      );
      await expect(yamanekoSBT.connect(minter).mint(other.address, 1)).to.not.be
        .reverted;
      expect(await yamanekoSBT.balanceOf(other.address)).to.equal(1);

      await expect(
        yamanekoSBT.connect(minter).mint(other.address, 1)
      ).to.be.revertedWith("This address already has this contentsId");
      expect(await yamanekoSBT.balanceOf(other.address)).to.equal(1);
    });

    it("The same wallet can be minted if the content ID changes", async function () {
      const { yamanekoSBT, minter, other } = await loadFixture(
        deployYamanekoSBTFixture
      );
      await expect(yamanekoSBT.connect(minter).mint(other.address, 1)).to.not.be
        .reverted;
      expect(await yamanekoSBT.balanceOf(other.address)).to.equal(1);

      await expect(yamanekoSBT.connect(minter).mint(other.address, 2)).to.not.be
        .reverted;
      expect(await yamanekoSBT.balanceOf(other.address)).to.equal(2);
    });

    // It takes a long time!!!
    // it("should mint tokens to 10,000 contentId", async function () {
    //   this.timeout(0); // Disable timeout as this will take a long time
    //   const { yamanekoSBT, minter, other } = await loadFixture(
    //     deployYamanekoSBTFixture
    //   );
    //   for (let i = 1; i <= 10000; i++) {
    //     await expect(yamanekoSBT.connect(minter).mint(other.address, i)).to.not
    //       .be.reverted;
    //   }
    //   expect(await yamanekoSBT.balanceOf(other.address)).to.equal(10000);
    // });

    // It takes a long time!!!
    // it("should mint tokens to 10,000 wallets", async function () {
    //   this.timeout(0); // Disable timeout as this will take a long time
    //   const { yamanekoSBT, minter } = await loadFixture(
    //     deployYamanekoSBTFixture
    //   );

    //   const wallets = [];
    //   for (let i = 0; i < 10000; i++) {
    //     // Generate a new wallet
    //     const wallet = ethers.Wallet.createRandom();
    //     // Connect the wallet to the provider
    //     const walletConnected = wallet.connect(ethers.provider);
    //     // Add the wallet to the array of wallets
    //     wallets.push(walletConnected);
    //   }

    //   // Attempt to mint a token for each wallet
    //   for (const wallet of wallets) {
    //     await expect(yamanekoSBT.connect(minter).mint(wallet.address, 1)).to.not
    //       .be.reverted;
    //   }
    // });
  });

  describe("tokenURI", function () {
    it("should return the tokenURI", async function () {
      const { yamanekoSBT, admin, minter, other } = await loadFixture(
        deployYamanekoSBTFixture
      );
      const fixMetadata = "https://fix.com/1.json";
      const baseURI = "https://base.com/";
      await yamanekoSBT.connect(admin).setFixMetadata(fixMetadata);
      await yamanekoSBT.connect(admin).setBaseURI(baseURI);
      await expect(yamanekoSBT.connect(minter).mint(other.address, 1)).to.not.be
        .reverted;
      // default
      expect(await yamanekoSBT.tokenURI(1)).to.equal(fixMetadata);

      // baseURI
      await yamanekoSBT.connect(admin).setSwitchURI(1);
      expect(await yamanekoSBT.tokenURI(1)).to.equal(baseURI + "1.json");
    });
  });

  describe("view Function", function () {
    it("getBattleNFT", async function () {
      const { yamanekoSBT, setter, minter, other } = await loadFixture(
        deployYamanekoSBTFixture
      );
      for (let i = 1; i <= 10; i++) {
        await expect(yamanekoSBT.connect(minter).mint(other.address, i)).to.not
          .be.reverted;
      }
      expect(await yamanekoSBT.balanceOf(other.address)).to.equal(10);
      await yamanekoSBT.setTokenBattleNFT(5, 1234);

      expect(await yamanekoSBT.getBattleNFT(5)).to.equal(1234);
    });

    it("getTokenId", async function () {
      const { yamanekoSBT, setter, minter, other } = await loadFixture(
        deployYamanekoSBTFixture
      );
      for (let i = 1; i <= 10; i++) {
        await expect(yamanekoSBT.connect(minter).mint(other.address, i)).to.not
          .be.reverted;
      }
      expect(await yamanekoSBT.balanceOf(other.address)).to.equal(10);

      for (let i = 1; i <= 10; i++) {
        expect(await yamanekoSBT.getTokenId(i, other.address)).to.equal(i);
      }
    });

    it("getContentsId", async function () {
      const { yamanekoSBT, setter, minter, other } = await loadFixture(
        deployYamanekoSBTFixture
      );
      for (let i = 1; i <= 10; i++) {
        await expect(yamanekoSBT.connect(minter).mint(other.address, i)).to.not
          .be.reverted;
      }
      expect(await yamanekoSBT.balanceOf(other.address)).to.equal(10);

      for (let i = 1; i <= 10; i++) {
        expect(await yamanekoSBT.getContentsId(i)).to.equal(i);
      }
    });
  });
});
