const DaiJSON = require('../build/contracts/DAI.json');


const Web3 = require('web3');
const aztec = require('aztec.js');
const dotenv = require('dotenv');

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

async function getBalance(accountIndex, callback){

    let accounts = await web3.eth.getAccounts();
    account = accounts[accountIndex];
    let chainID  = await web3.eth.net.getId();
    let DAIInstance = new web3.eth.Contract(DaiJSON.abi, DaiJSON.networks[chainID]["address"]);
    let amt = await DAIInstance.methods.balanceOf(account).call()
    callback(amt)
}

async function mintDAI(amount, eth, callback){
    let accounts = await web3.eth.getAccounts();
    account = accounts[1];
    let chainID  = await web3.eth.net.getId();
    let DAIInstance = new web3.eth.Contract(DaiJSON.abi, DaiJSON.networks[chainID]["address"]);

    let tx = await web3.eth.sendTransaction({
        "from": account,
        "to": "0x0000000000000000000000000000000000000000",
        "value": eth
    })
    tx = await DAIInstance.methods.mint(account, amount).send({from: account});
    callback(tx["transactionHash"]);
}

async function mintDAI2(amount, callback){
    let accounts = await web3.eth.getAccounts();
    account = accounts[2];
    let chainID  = await web3.eth.net.getId();
    let DAIInstance = new web3.eth.Contract(DaiJSON.abi, DaiJSON.networks[chainID]["address"]);
    let tx = await web3.eth.sendTransaction({
        "from": account,
        "to": "0x0000000000000000000000000000000000000000",
        "value": eth
    })
    tx = await DAIInstance.methods.mint(account, amount).send({from: account});
    callback(tx["transactionHash"]);
}

module.exports = {
    getBalance,
    mintDAI,
    mintDAI2
}

