const hre = require("hardhat");

const main = async () => {
  const Tinder = await hre.ethers.getContractFactory("Tinder");
  const tinder = await Tinder.deploy();
  await tinder.waitForDeployment();
  console.log("Tinder deployed to:", await tinder.getAddress());
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
