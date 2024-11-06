// scripts/create-box.js
import { ethers, upgrades } from "hardhat";

async function main() {
  const GuitarCryptone = await ethers.getContractFactory("GuitarCryptone");
  console.log("Start deploying GuitarCryptone...");
  const proxy = await upgrades.deployProxy(GuitarCryptone, ["AmplifierCryptone", "ACT", ""]);
  await proxy.waitForDeployment();
  console.log("GuitarCryptone deployed to:", await proxy.getAddress());
}

main();
