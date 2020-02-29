const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


function getBalance(accountIndex, callback){
    web3.eth.getAccounts().then((accounts)=>{
        web3.eth.getBalance(accounts[accountIndex])
        .then(bal => callback(bal));
    })
}

module.exports = {
    getBalance
}