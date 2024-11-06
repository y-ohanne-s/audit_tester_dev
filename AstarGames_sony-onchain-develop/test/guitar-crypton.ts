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

describe("Token contract Guitar", function () {
  let contractAddress = "";
  let proxy: any = ""
  const paramDeployment: string[] = ["GuitarCryptone", "GCT", ""];
  const version: string = "1";
  const deadline: number = 9999999999;
  const tokenId: number = 1;
  const secondTokenId: number = 2;

  console.log("Start deploying GuitarCryptone...");
  console.log('.......................................');
  before(async function () {
    const GuitarCryptone = await ethers.getContractFactory("GuitarCryptone");
    proxy = await upgrades.deployProxy(GuitarCryptone, paramDeployment);
    await proxy.waitForDeployment();
    contractAddress = await proxy.getAddress();
  });

  after(function () {
    console.log('.......................................');
    console.log('Test contract successfully!');
  });

  it("Deployment contract token", async function () {
    expect(proxy).to.not.equal(null);
    const [paramsName, paramSymbol] = paramDeployment;
    const name = await proxy.name();
    expect(name).to.equal(paramsName);
    const symbol = await proxy.symbol();
    expect(symbol).to.equal(paramSymbol);
  });

  it("Mint nft for address", async function () {
    const owner = getSigner();
    await proxy.safeMint(owner.address, tokenId);
    const ownerNft = await proxy.ownerOf(tokenId);
    expect(ownerNft).to.equal(owner.address);
  });

  it("Permit for spender", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const signer = getSigner();
    const nonce = await proxy.nonces(tokenId);
    const params: SignatureParams = { contractAddress, spender: addr1.address, tokenId, nonce, signer, paramDeployment, version, deadline };
    const signature = await getSignature(params);
    await proxy.permit(addr1.address, tokenId, deadline, signature.value);
    const permitted = await proxy.getApproved(tokenId);
    expect(permitted).to.equal(addr1.address);
  });

  it("Transfer nft with permit", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const signer = getSigner();
    const nonce = await proxy.nonces(tokenId);
    const params: SignatureParams = { contractAddress, spender: addr1.address, tokenId, nonce, signer, paramDeployment, version, deadline };
    const signature = await getSignature(params);
    const ownerNftBefore = await proxy.ownerOf(tokenId);
    await proxy.safeTransferFromWithPermit(owner.address, addr1.address, tokenId, deadline, signature.value);
    expect(ownerNftBefore).to.equal(signer.address);
    const ownerNftAfter = await proxy.ownerOf(tokenId);
    expect(ownerNftAfter).to.equal(addr1.address);
  });

  it("Mint nft for other address", async function () {
    const signer = getSigner(1);
    await proxy.safeMint(signer.address, secondTokenId);
    const ownerNft = await proxy.ownerOf(secondTokenId);
    expect(ownerNft).to.equal(signer.address);
  });

  it("Permit for spender with second token id", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const signer = getSigner(1);
    const nonce = await proxy.nonces(secondTokenId);
    const params: SignatureParams = { contractAddress, spender: owner.address, tokenId: secondTokenId, nonce, signer, paramDeployment, version, deadline };
    const signature = await getSignature(params);
    await proxy.permit(owner.address, secondTokenId, deadline, signature.value);
    const permitted = await proxy.getApproved(secondTokenId);
    expect(permitted).to.equal(owner.address);
  });

  it("Transfer nft with permit with second token id", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const signer = getSigner(1);
    const nonce = await proxy.nonces(secondTokenId);
    const params: SignatureParams = { contractAddress, spender: owner.address, tokenId: secondTokenId, nonce, signer, paramDeployment, version, deadline };
    const signature = await getSignature(params);
    const ownerNftBefore = await proxy.ownerOf(secondTokenId);
    await proxy.safeTransferFromWithPermit(signer.address, owner.address, secondTokenId, deadline, signature.value);
    expect(ownerNftBefore).to.equal(signer.address);
    const ownerNftAfter = await proxy.ownerOf(secondTokenId);
    expect(ownerNftAfter).to.equal(owner.address);
  });
});
