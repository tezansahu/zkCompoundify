const _DAI = artifacts.require("./DAI.sol");
const _cDAI = artifacts.require("./cDAI.sol");
// const czkETH = artifacts.require("./LSTProtocolToken.sol");

module.exports = async (deployer) => {

    const DAI = await deployer.deploy(_DAI);
    const cDAI = await deployer.deploy(_cDAI);
    // const lst = await deployer.deploy(LST);
    // console.log("ERC20_A:", erc20_A.address);
    // console.log("ERC20_B:", erc20_B.address);
}