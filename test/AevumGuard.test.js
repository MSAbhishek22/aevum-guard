// AevumGuard contract tests — implements TEST_PLAN.md §A (A1–A24) exactly.
// Run: npx hardhat test
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const CAT_A = ethers.encodeBytes32String("contributors");
const CAT_B = ethers.encodeBytes32String("groceries");
const U = (n) => ethers.parseUnits(String(n), 6); // mock uses 6 decimals

async function deploy(tokenAddr, signer) {
  const F = await ethers.getContractFactory("AevumGuard", signer);
  const g = await F.deploy(tokenAddr);
  await g.waitForDeployment();
  return g;
}

async function setupFunded(fundAmount = 1000) {
  const [owner, alice, bob, session] = await ethers.getSigners();
  const Mock = await ethers.getContractFactory("MockERC20", owner);
  const token = await Mock.deploy();
  await token.waitForDeployment();
  const guard = await deploy(await token.getAddress(), owner);
  await token.mint(owner.address, U(10000));
  if (fundAmount > 0) {
    await token.approve(await guard.getAddress(), U(fundAmount));
    await guard.fund(U(fundAmount));
  }
  return { owner, alice, bob, session, token, guard };
}

async function increaseTime(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine", []);
}

describe("AevumGuard — TEST_PLAN §A", function () {
  it("A1 deploy: token correct, owner = deployer", async function () {
    const { owner, token, guard } = await setupFunded(0);
    expect(await guard.token()).to.equal(await token.getAddress());
    expect(await guard.owner()).to.equal(owner.address);
  });

  it("A2 fund() without prior approve reverts", async function () {
    const [owner] = await ethers.getSigners();
    const Mock = await ethers.getContractFactory("MockERC20", owner);
    const token = await Mock.deploy();
    const guard = await deploy(await token.getAddress(), owner);
    await token.mint(owner.address, U(100));
    await expect(guard.fund(U(10))).to.be.reverted;
  });

  it("A3 fund() with approval increases guard balance + Funded emitted", async function () {
    const { owner, token, guard } = await setupFunded(0);
    await token.mint(owner.address, U(500));
    await token.approve(await guard.getAddress(), U(200));
    await expect(guard.fund(U(200))).to.emit(guard, "Funded");
    expect(await token.balanceOf(await guard.getAddress())).to.equal(U(200));
  });

  it("A4 setLimit by non-owner reverts", async function () {
    const { alice, bob, guard } = await setupFunded();
    await expect(
      guard.connect(alice).setLimit(bob.address, U(10), U(50), U(100), CAT_A)
    ).to.be.revertedWithCustomError(guard, "OwnableUnauthorizedAccount");
  });

  it("A5 setLimit perTx > perDay reverts (ordering invariant)", async function () {
    const { bob, guard } = await setupFunded();
    await expect(
      guard.setLimit(bob.address, U(60), U(50), U(100), CAT_A)
    ).to.be.revertedWithCustomError(guard, "InvalidLimitOrdering");
  });

  it("A6 setLimit all-zero pauses recipient (payments revert)", async function () {
    const { bob, guard } = await setupFunded();
    await guard.setLimit(bob.address, 0, 0, 0, CAT_A);
    await expect(guard.pay(bob.address, U(1), CAT_A))
      .to.be.revertedWithCustomError(guard, "NoActiveLimit");
  });

  it("A7 pay to recipient with no limit reverts NoActiveLimit", async function () {
    const { bob, guard } = await setupFunded();
    await expect(guard.pay(bob.address, U(1), CAT_A))
      .to.be.revertedWithCustomError(guard, "NoActiveLimit");
  });

  it("A8 pay over per-tx cap reverts OverPerTxCap", async function () {
    const { bob, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(10), U(50), U(100), CAT_A);
    await expect(guard.pay(bob.address, U(11), CAT_A))
      .to.be.revertedWithCustomError(guard, "OverPerTxCap");
  });

  it("A9 daily cap: two pays pass, third reverts OverDailyCap", async function () {
    const { bob, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(30), U(50), U(500), CAT_A);
    await guard.pay(bob.address, U(30), CAT_A);
    await guard.pay(bob.address, U(20), CAT_A);
    await expect(guard.pay(bob.address, U(1), CAT_A))
      .to.be.revertedWithCustomError(guard, "OverDailyCap");
  });

  it("A10 daily window rolls over after 24h", async function () {
    const { bob, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(30), U(50), U(500), CAT_A);
    await guard.pay(bob.address, U(30), CAT_A);
    await guard.pay(bob.address, U(20), CAT_A);
    await increaseTime(24 * 3600 + 1);
    const [spentToday] = await guard.getSpent(bob.address);
    expect(spentToday).to.equal(0n);
    await guard.pay(bob.address, U(10), CAT_A); // succeeds again
  });

  it("A11 weekly cap enforced across days reverts OverWeeklyCap", async function () {
    const { bob, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(40), U(40), U(70), CAT_A);
    await guard.pay(bob.address, U(40), CAT_A); // day 1: 40
    await increaseTime(24 * 3600 + 1);
    await guard.pay(bob.address, U(30), CAT_A); // day 2: week total 70
    await increaseTime(24 * 3600 + 1);
    await expect(guard.pay(bob.address, U(1), CAT_A))
      .to.be.revertedWithCustomError(guard, "OverWeeklyCap");
  });

  it("A12 grantSession by non-owner reverts", async function () {
    const { alice, session, guard } = await setupFunded();
    await expect(
      guard.connect(alice).grantSession(session.address, CAT_A, U(10), 3600)
    ).to.be.revertedWithCustomError(guard, "OwnableUnauthorizedAccount");
  });

  it("A13 session key pays within scope + cap; Payment emitted with session actor", async function () {
    const { bob, session, token, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await guard.grantSession(session.address, CAT_A, U(20), 3600);
    const tx = guard.connect(session).pay(bob.address, U(15), CAT_A);
    await expect(tx).to.emit(guard, "Payment");
    expect(await token.balanceOf(bob.address)).to.equal(U(15));
    const s = await guard.getSession(session.address);
    expect(s.spent).to.equal(U(15));
  });

  it("A14 session key pays outside scope reverts ScopeMismatch", async function () {
    const { bob, session, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await guard.grantSession(session.address, CAT_A, U(20), 3600);
    await expect(guard.connect(session).pay(bob.address, U(5), CAT_B))
      .to.be.revertedWithCustomError(guard, "ScopeMismatch");
  });

  it("A15 session key pays over its maxPerTx reverts OverPerTxCap", async function () {
    const { bob, session, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await guard.grantSession(session.address, CAT_A, U(20), 3600);
    await expect(guard.connect(session).pay(bob.address, U(21), CAT_A))
      .to.be.revertedWithCustomError(guard, "OverPerTxCap");
  });

  it("A16 session key pays after expiry reverts SessionExpired", async function () {
    const { bob, session, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await guard.grantSession(session.address, CAT_A, U(20), 3600);
    await increaseTime(3601);
    await expect(guard.connect(session).pay(bob.address, U(5), CAT_A))
      .to.be.revertedWithCustomError(guard, "SessionExpired");
  });

  it("A17 owner revokes session; key pays after reverts SessionRevoked", async function () {
    const { bob, session, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await guard.grantSession(session.address, CAT_A, U(20), 3600);
    await guard.revokeSession(session.address);
    await expect(guard.connect(session).pay(bob.address, U(5), CAT_A))
      .to.be.revertedWithCustomError(guard, "SessionRevoked");
  });

  it("A18 session key cannot setLimit / withdraw (owner-only)", async function () {
    const { owner, bob, session, guard } = await setupFunded();
    await guard.grantSession(session.address, CAT_A, U(20), 3600);
    await expect(
      guard.connect(session).setLimit(bob.address, U(1), U(1), U(1), CAT_A)
    ).to.be.revertedWithCustomError(guard, "OwnableUnauthorizedAccount");
    await expect(
      guard.connect(session).withdraw(U(1), session.address)
    ).to.be.revertedWithCustomError(guard, "OwnableUnauthorizedAccount");
    expect(owner.address).to.not.equal(session.address);
  });

  it("A19 withdraw by owner moves funds + Withdrawn emitted", async function () {
    const { owner, token, guard } = await setupFunded(300);
    const before = await token.balanceOf(owner.address);
    await expect(guard.withdraw(U(100), owner.address)).to.emit(guard, "Withdrawn");
    expect(await token.balanceOf(owner.address)).to.equal(before + U(100));
  });

  it("A20 pay exceeding guard balance reverts InsufficientGuardBalance", async function () {
    const { bob, guard } = await setupFunded(10); // only 10 in guard
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await expect(guard.pay(bob.address, U(50), CAT_A))
      .to.be.revertedWithCustomError(guard, "InsufficientGuardBalance");
  });

  it("A21 audit chain: 5 actions -> verifyChain returns (true, 0)", async function () {
    const { bob, session, guard } = await setupFunded(); // fund() in setup = receipt #1
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A); // #2
    await guard.grantSession(session.address, CAT_A, U(20), 3600);   // #3
    await guard.pay(bob.address, U(10), CAT_A);                      // #4
    await guard.revokeSession(session.address);                      // #5
    const n = Number(await guard.auditNonce());
    expect(n).to.be.greaterThanOrEqual(5);
    const hashes = [];
    for (let i = 1; i <= n; i++) hashes.push(await guard.receiptHash(i));
    const [ok, idx] = await guard.verifyChain(hashes);
    expect(ok).to.equal(true);
    expect(idx).to.equal(0n);
  });

  it("A22 audit chain: tampered hash -> verifyChain returns (false, index)", async function () {
    const { bob, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await guard.pay(bob.address, U(5), CAT_A);
    const n = Number(await guard.auditNonce());
    const hashes = [];
    for (let i = 1; i <= n; i++) hashes.push(await guard.receiptHash(i));
    const tampered = [...hashes];
    tampered[1] = ethers.keccak256(ethers.toUtf8Bytes("forged"));
    const [ok, idx] = await guard.verifyChain(tampered);
    expect(ok).to.equal(false);
    expect(idx).to.equal(1n);
  });

  it("A23 reentrancy attempt on pay: no double-spend, single transfer", async function () {
    const [owner, bob] = await ethers.getSigners();
    const RT = await ethers.getContractFactory("ReentrantToken", owner);
    const token = await RT.deploy();
    await token.waitForDeployment();
    const guard = await deploy(await token.getAddress(), owner);
    await token.mint(owner.address, U(1000));
    await token.approve(await guard.getAddress(), U(500));
    await guard.fund(U(500));
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await token.arm(await guard.getAddress(), bob.address, CAT_A);
    await guard.pay(bob.address, U(20), CAT_A);
    expect(await token.reentryAttempted()).to.equal(true);
    expect(await token.reentrySucceeded()).to.equal(false);
    expect(await token.balanceOf(bob.address)).to.equal(U(20)); // exactly once
  });

  it("A24 zero-amount pay reverts", async function () {
    const { bob, guard } = await setupFunded();
    await guard.setLimit(bob.address, U(50), U(100), U(500), CAT_A);
    await expect(guard.pay(bob.address, 0, CAT_A))
      .to.be.revertedWithCustomError(guard, "ZeroAmount");
  });
});
