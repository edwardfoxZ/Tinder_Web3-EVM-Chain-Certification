const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tinder", function () {
  async function deploymentFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, account1, account2] = await ethers.getSigners();

    const Tinder = await ethers.getContractFactory("Tinder");
    const tinder = await Tinder.deploy();

    return { tinder, owner, account1, account2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { tinder, owner } = await loadFixture(deploymentFixture);
      expect(await tinder.owner()).to.equal(owner.address);
    });
  });

  describe("Register", function () {
    it("Should not allow to register with age less than 18", async function () {
      const { tinder, account2 } = await loadFixture(deploymentFixture);
      await expect(
        tinder
          .connect(account2)
          .register(17, 0, "Julia", "Los Angles", "http://example.com/pic.jpg")
      ).to.be.revertedWith("you must at the age");
    });

    it("Should register", async function () {
      const { tinder, account1 } = await loadFixture(deploymentFixture);
      expect(
        await tinder
          .connect(account1)
          .register(25, 0, "Alice", "New York", "http://example.com/pic.jpg")
      ).to.not.be.reverted;
    });

    it("Should confirm user exists after registration", async function () {
      const { tinder, account1 } = await loadFixture(deploymentFixture);
      await tinder
        .connect(account1)
        .register(25, 0, "Alice", "New York", "http://example.com/pic.jpg");
      await expect(tinder.getUser(account1.address)).to.not.be.reverted;
    });
  });

  describe("Get Matchable Users", function () {
    it("Should return matchable users", async function () {
      const { tinder, account1 } = await loadFixture(deploymentFixture);
      await tinder
        .connect(account1)
        .register(25, 0, "Alice", "New York", "http://example.com/pic.jpg");

      const result = await tinder
        .connect(account1)
        .getMatchableUsers(account1.address, 0, 5);

      expect(result.length).to.be.at.most(5);
    });
  });

  describe("Swipe", function () {
    it("Should not swipe twice", async function () {
      const { tinder, account1 } = await loadFixture(deploymentFixture);
      await tinder
        .connect(account1)
        .register(25, 0, "Alice", "New York", "http://example.com/pic.jpg");

      expect(
        await tinder.connect(account1).swipe(account1.address, 0)
      ).to.be.revertedWith("you cannot swipe a person twice");
    });

    it("Should swipe", async function () {
      const { tinder, account1 } = await loadFixture(deploymentFixture);
      await tinder
        .connect(account1)
        .register(25, 0, "Alice", "New York", "http://example.com/pic.jpg");

      expect(await tinder.connect(account1).swipe(account1.address, 2)).to.not
        .be.reverted;
    });
  });

  describe("Message", function () {
    it("Should not send message if not matchable", async function () {
      const { tinder, account1, account2 } = await loadFixture(
        deploymentFixture
      );
      await tinder
        .connect(account1)
        .register(25, 0, "Alice", "New York", "http://example.com/pic.jpg");

      await tinder
        .connect(account2)
        .register(24, 0, "Julia", "Los Angles", "http://example.com/pic.jpg");

      const swipeStatus = await tinder.getSwipeStatus(
        account2.address,
        account1.address
      );

      expect(swipeStatus).to.equal(0);

      await expect(
        tinder.connect(account2).message(account1, "hello")
      ).to.be.revertedWith("messaging allowed only between mutual matches");
    });

    it("Should send message", async function () {
      const { tinder, account1, account2 } = await loadFixture(
        deploymentFixture
      );

      await tinder
        .connect(account1)
        .register(25, 0, "Alice", "New York", "http://example.com/pic.jpg");

      await tinder
        .connect(account2)
        .register(24, 0, "Julia", "Los Angles", "http://example.com/pic.jpg");

      await tinder.connect(account1).swipe(account2.address, 1);
      await tinder.connect(account2).swipe(account1.address, 1);

      expect(await tinder.connect(account1).message(account2.address, "hello"))
        .to.be.not.reverted;
    });
  });
});
