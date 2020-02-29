const ZkERC20 = artifacts.require("./ZkERC20.sol");

const DAI = artifacts.require("./DAI.sol");
const cDAI = artifacts.require("./cDAI.sol");

const ACE = artifacts.require("./ACE.sol");

const CompoundDAIMarket = artifacts.require("CompoundDAIMarket");

module.exports = async (deployer) => {
    const _ACE = await ACE.deployed();
    const _DAI = await DAI.deployed();
    const _cDAI = await cDAI.deployed();
    // console.log(_ERC20_A, _ERC20_B);
    const zkDAI = await deployer.deploy(ZkERC20, _ACE.address, _DAI.address); // random address for now
    const czkDAI = await deployer.deploy(ZkERC20, _ACE.address, _cDAI.address); // random address for now
    // const czkDAI = await deployer.deploy(ZkERC20, _ACE.address, "0x0000000000000000000000000000000000000000");

    return deployer.deploy(CompoundDAIMarket, zkDAI.address, czkDAI.address);
    // console.log("zkERC20_A:", zkERC20_A.address);
    // console.log("zkERC20_B:", zkERC20_B.address);
}
