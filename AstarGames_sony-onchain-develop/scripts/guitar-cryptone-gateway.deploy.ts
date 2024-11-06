// scripts/create-box.js
import { ethers, upgrades } from "hardhat";

async function main() {
  const GuitarCryptoneGateway = await ethers.deployContract("GuitarCryptoneGateway");
  const GuitarCryptoneGatewayAddress = await GuitarCryptoneGateway.getAddress();
  console.log("GuitarCryptoneGateway deployed to:", GuitarCryptoneGatewayAddress);
}

main();
