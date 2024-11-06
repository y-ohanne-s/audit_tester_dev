import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const YamanekoSBT = await ethers.getContractFactory("YamanekoSBT");
  const yamanekoSBT = await upgrades.deployProxy(YamanekoSBT, [], {
    kind: "uups",
  });

  await yamanekoSBT.deployed();
  console.info("yamanekoSBTContract:", yamanekoSBT.address);

  const YamanekoNFT = await ethers.getContractFactory("YamanekoNFT");
  const yamanekoNFT = await upgrades.deployProxy(
    YamanekoNFT,
    [yamanekoSBT.address],
    {
      kind: "uups",
    }
  );

  await yamanekoNFT.deployed();
  console.info("yamanekoNFTContract:", yamanekoNFT.address);

  const ADMIN_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("ADMIN_ROLE")
  );
  const MINTER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MINTER_ROLE")
  );
  const BURNER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("BURNER_ROLE")
  );
  const SETTER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("SETTER_ROLE")
  );

  // Setting
  // Granted setter authority to yamanekoNFT as well
  await yamanekoSBT.grantRole(SETTER_ROLE, yamanekoNFT.address);
  console.info("yamanekoSBT->yamanekoNFT SETTER_ROLE granted");

  // Authorization to the operating wallet
  await yamanekoSBT.grantRole(MINTER_ROLE, process.env.OPERATER_ADDRESS_1);
  await yamanekoSBT.grantRole(MINTER_ROLE, process.env.OPERATER_ADDRESS_2);
  await yamanekoSBT.grantRole(MINTER_ROLE, process.env.OPERATER_ADDRESS_3);
  console.info("yamanekoSBT->OPERATER_ADDRESS_1 MINTER_ROLE granted");
  console.info("yamanekoSBT->OPERATER_ADDRESS_2 MINTER_ROLE granted");
  console.info("yamanekoSBT->OPERATER_ADDRESS_3 MINTER_ROLE granted");

  await yamanekoSBT.grantRole(SETTER_ROLE, process.env.OPERATER_ADDRESS_1);
  await yamanekoSBT.grantRole(SETTER_ROLE, process.env.OPERATER_ADDRESS_2);
  await yamanekoSBT.grantRole(SETTER_ROLE, process.env.OPERATER_ADDRESS_3);
  console.info("yamanekoSBT->OPERATER_ADDRESS_1 SETTER_ROLE granted");
  console.info("yamanekoSBT->OPERATER_ADDRESS_2 SETTER_ROLE granted");
  console.info("yamanekoSBT->OPERATER_ADDRESS_3 SETTER_ROLE granted");

  await yamanekoNFT.grantRole(MINTER_ROLE, process.env.OPERATER_ADDRESS_1);
  await yamanekoNFT.grantRole(MINTER_ROLE, process.env.OPERATER_ADDRESS_2);
  await yamanekoNFT.grantRole(MINTER_ROLE, process.env.OPERATER_ADDRESS_3);
  console.info("yamanekoNFT->OPERATER_ADDRESS_1 MINTER_ROLE granted");
  console.info("yamanekoNFT->OPERATER_ADDRESS_2 MINTER_ROLE granted");
  console.info("yamanekoNFT->OPERATER_ADDRESS_3 MINTER_ROLE granted");

  await yamanekoNFT.grantRole(BURNER_ROLE, process.env.OPERATER_ADDRESS_1);
  await yamanekoNFT.grantRole(BURNER_ROLE, process.env.OPERATER_ADDRESS_2);
  await yamanekoNFT.grantRole(BURNER_ROLE, process.env.OPERATER_ADDRESS_3);
  console.info("yamanekoNFT->OPERATER_ADDRESS_1 BURNER_ROLE granted");
  console.info("yamanekoNFT->OPERATER_ADDRESS_2 BURNER_ROLE granted");
  console.info("yamanekoNFT->OPERATER_ADDRESS_3 BURNER_ROLE granted");

  await yamanekoNFT.grantRole(SETTER_ROLE, process.env.OPERATER_ADDRESS_1);
  await yamanekoNFT.grantRole(SETTER_ROLE, process.env.OPERATER_ADDRESS_2);
  await yamanekoNFT.grantRole(SETTER_ROLE, process.env.OPERATER_ADDRESS_3);
  console.info("yamanekoNFT->OPERATER_ADDRESS_1 SETTER_ROLE granted");
  console.info("yamanekoNFT->OPERATER_ADDRESS_2 SETTER_ROLE granted");
  console.info("yamanekoNFT->OPERATER_ADDRESS_3 SETTER_ROLE granted");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
