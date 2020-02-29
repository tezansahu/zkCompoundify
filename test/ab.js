const utils = require('@aztec/dev-utils');
var Contract = require('truffle-contract');
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const aztec = require('aztec.js');
const dotenv = require('dotenv');
dotenv.config();
const secp256k1 = require('@aztec/secp256k1');


// const PrivateVenmo = artifacts.require('./PrivateVenmo.sol');
// const ZkAssetMintable = artifacts.require('./ZkAssetMintable.sol');
var ZkAssetMintable = Contract(require('../build/contracts/ZkAssetMintable.json'));
// const ZkAssetMintable = Contract(require('@aztec/protocol/contracts/ERC1724/ZkAsset.sol'))
ZkAssetMintable.setProvider(provider);
// const JoinSplit = artifacts.require('@aztec/protocol/contracts/ACE/validators/joinSplit/JoinSplit.sol');

const {
  proofs: {
    MINT_PROOF,
  },
} = utils;

const { JoinSplitProof, MintProof } = aztec;
  
  let privatePaymentContract;


  const sendConfidentialTransaction = async function(value){
    const accounts = await new Web3(provider).eth.getAccounts();
    // console.log(accounts[0]);
    
    const bob = secp256k1.accountFromPrivateKey("0xac071cfa36749d1a7b1b802ff0583a5f9bf1b6ef650dcd882578f2c22f135408");
  const sally = secp256k1.accountFromPrivateKey("0x2eab689d3afa5aa86fe5829d2aaf7b844cc3a91a3ba84ad6397001103a635651");
  
    privatePaymentContract = await ZkAssetMintable.deployed();
    
    console.log('Bob wants to deposit 100');
    const bobNote1 = await aztec.note.create(bob.publicKey, 100);

    const newMintCounterNote = await aztec.note.create(bob.publicKey, 100);
    const zeroMintCounterNote = await aztec.note.createZeroValueNote();
    const sender = privatePaymentContract.address;
    const mintedNotes = [bobNote1];

    const mintProof = new MintProof(
      zeroMintCounterNote,
      newMintCounterNote,
      mintedNotes,
      sender,
    );

    const mintData = mintProof.encodeABI();

    // await privatePaymentContract.setProofs(1, -1, {from: accounts[0]});
    await privatePaymentContract.confidentialMint(MINT_PROOF, mintData, {from: accounts[0]});

    console.log('Bob succesffully deposited 100');

    // bob needs to pay sally for a taxi
    // the taxi is 25
    // if bob pays with his note worth 100 he requires 75 change
    console.log('Bob takes a taxi, Sally is the driver');
    const sallyTaxiFee = await aztec.note.create(sally.publicKey, value);

    const bobNote2 = await aztec.note.create(bob.publicKey, 100-value);
    const sendProofSender = accounts[0];
    const withdrawPublicValue = 0;
    const publicOwner = accounts[0];

    const sendProof = new JoinSplitProof(
        mintedNotes,
        [sallyTaxiFee, bobNote2],
        sendProofSender,
        withdrawPublicValue,
        publicOwner
    );
    const sendProofData = sendProof.encodeABI(privatePaymentContract.address);
    const sendProofSignatures = sendProof.constructSignatures(privatePaymentContract.address, [bob])
    await privatePaymentContract.confidentialTransfer(sendProofData, sendProofSignatures, {
      from: accounts[0],
    });
    
    

    console.log(
      'Bob paid sally  for the taxi and gets his back'
    );

    console.log((await aztec.note.fromViewKey(sallyTaxiFee.getView())).k.toNumber());
    return [sallyTaxiFee.getView(), sallyTaxiFee.noteHash,bob, sally];

};

console.log(sendConfidentialTransaction(75));