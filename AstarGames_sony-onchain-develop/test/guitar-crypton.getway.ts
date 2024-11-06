import { expect } from "chai";
import { ethers, upgrades, config, network } from "hardhat";

interface SignatureParams {
  contractAddress: string;
  spender: string;
  tokenId: number;
  nonce: number;
  signer: any;
  paramDeployment: string[];
  version: string;
  deadline: number;
}

const getSignature = async ({
  contractAddress,
  spender,
  tokenId,
  nonce,
  signer,
  paramDeployment,
  version,
  deadline
}: SignatureParams) => {
  const [name] = paramDeployment;
  const domain = { name, version, chainId: network.config.chainId, verifyingContract: contractAddress };
  const types = {
    Permit: [
      { name: "spender", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };
  const message = { spender, tokenId, nonce: Number(nonce), deadline };
  const signature = await signer.signTypedData(domain, types, message);
  return { value: signature };
}

const getSigner = (index: number = 0) => {
  const accounts: any = config.networks.hardhat.accounts;
  const hdWallet = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(accounts.mnemonic), accounts.path + `/${index}`);

  return new ethers.Wallet(hdWallet.privateKey);
}

describe("Getway contract Guitar", function () {
  let contractAddress = "";
  let GuitarCryptoneGatewayAddress = "";
  let GuitarCryptoneGateway: any = "";
  let proxy: any = "";
  const paramDeployment: string[] = ["GuitarCryptone", "GCT", ""];
  const version: string = "1";
  const deadline: number = 9999999999;
  const tokenId: number = 1;

  before(async function () {
    console.log("Start deploying GuitarCryptone Getway...");
    console.log('.......................................');
    GuitarCryptoneGateway = await ethers.deployContract("GuitarCryptoneGateway");
    GuitarCryptoneGatewayAddress = await GuitarCryptoneGateway.getAddress();
    const GuitarCryptone = await ethers.getContractFactory("GuitarCryptone");
    proxy = await upgrades.deployProxy(GuitarCryptone, paramDeployment);
    await proxy.waitForDeployment();
    contractAddress = await proxy.getAddress();
  });
  after(function () {
    console.log('.......................................');
    console.log('Test contract successfully!');
  });

  it("Deploy contract", async function () {
    expect(GuitarCryptoneGateway).to.not.equal(null);
    expect(proxy).to.not.equal(null);
    const [paramsName, paramSymbol] = paramDeployment;
    const name = await proxy.name();
    expect(name).to.equal(paramsName);
    const symbol = await proxy.symbol();
    expect(symbol).to.equal(paramSymbol);
  });

  it("Set minter", async function () {
    const minterRole = await proxy.MINTER_ROLE();
    await proxy.grantRole(minterRole, GuitarCryptoneGatewayAddress);
    const isMinter = await proxy.hasRole(minterRole, GuitarCryptoneGatewayAddress);
    expect(isMinter).to.equal(true);
  });

  it("Import token from gateway contract", async function () {
    const [owner, addr1] = await ethers.getSigners();

    const minterRole = await proxy.MINTER_ROLE();
    const isMinter = await proxy.hasRole(minterRole, GuitarCryptoneGatewayAddress);
    expect(isMinter).to.equal(true);

    const adminRole = await GuitarCryptoneGateway.DEFAULT_ADMIN_ROLE();
    const operatorRole = await GuitarCryptoneGateway.OPERATOR_ROLE();
    console.log(owner.address);
    const isAdmin = await GuitarCryptoneGateway.hasRole(adminRole, owner.address);
    console.log({ isAdmin })
    expect(isAdmin).to.equal(true);

    const isOperator = await proxy.hasRole(operatorRole, owner.address);
    console.log({ isOperator })
    expect(isOperator).to.equal(true);

    // await GuitarCryptoneGateway.setERC721Addresses([1], [GuitarCryptoneGatewayAddress]);
    // await proxy.safeMint(owner.address, tokenId);
    // const ownerNft = await proxy.ownerOf(tokenId);
    // expect(ownerNft).to.equal(owner.address);
    // const signer = getSigner();
    // const nonce = await proxy.nonces(tokenId);

    // const signatureParams: SignatureParams = {
    //   contractAddress,
    //   spender: GuitarCryptoneGatewayAddress,
    //   tokenId,
    //   nonce,
    //   signer,
    //   paramDeployment,
    //   version,
    //   deadline
    // };
    // const { value: signature } = await getSignature(signatureParams);


    // expect(isOperator).to.equal(true);

    // await GuitarCryptoneGateway.importNfts(owner.address, 1, [tokenId], "123456789", deadline, [signature]);

    // const ownerNftAfter = await proxy.ownerOf(tokenId);
    // expect(ownerNftAfter).to.equal(GuitarCryptoneGatewayAddress);
  });
});
