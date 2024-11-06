// scripts/create-box.js
import { ethers, upgrades } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  const deadline = 9999999999999;
  const GuitarCryptonePaymentGateway = await ethers.deployContract("GuitarCryptonePaymentGateway", [
    owner.address,
    deadline
  ]);
  const GuitarCryptonePaymentGatewayAddress = await GuitarCryptonePaymentGateway.getAddress();
  console.log("GuitarCryptonePaymentGateway deployed to:", GuitarCryptonePaymentGatewayAddress);
}

main()
  .then(() => process.exit())
  .catch(err => {
    console.error(err);
    process.exit(-1);
  });
