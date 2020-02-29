const utils = require('@aztec/dev-utils');

const JoinSplitFluid = artifacts.require('../contracts/AZTEC/ACE/validators/joinSplitFluid/JoinSplitFluid.sol');
const Swap = artifacts.require('../contracts/AZTEC/ACE/validators/swap/Swap.sol');
// const Dividend = artifacts.require('./Dividend.sol');
// const PrivateRange = artifacts.require('./PrivateRange.sol');
const JoinSplit = artifacts.require('../contracts/AZTEC/ACE/validators/joinSplit/JoinSplit.sol');
const ACE = artifacts.require("../contracts/AZTEC/ACE/ACE.sol")

const DAI = artifacts.require("../contracts/DAI.sol");
const MAT = artifacts.require("../contracts/MAT.sol");
const cDAI = artifacts.require("../contracts/cDAI.sol");

const ZkERC20 = artifacts.require("../contracts/ZkERC20.sol");
const CompoundDAIMarket = artifacts.require("../contracts/CompoundDAIMarket");

const aztec = require('aztec.js');
const dotenv = require('dotenv');
dotenv.config();


const {
        constants,
        proofs: {
            JOIN_SPLIT_PROOF,
            MINT_PROOF,
            SWAP_PROOF,
            BURN_PROOF,
        },
    } = utils;

let aztecAccounts = require("./accounts.json");

function signNote(validatorAddress, noteHash, spender, privateKey) {
    let signature = aztec.signer.signNote(validatorAddress, noteHash, spender, privateKey);
    return signature;
}


contract('CompoundDAIMarket', (accounts) => {
    let ACEInstance;
    let CompoundDAIMarketInstance;
    // let KernelInstance;
    let DAIInstance;
    let cDAIInstance;
    let zkDAIInstance;
    let czkDAIInstance;
    // let protocolTokenInstance;
    const sender = accounts[0];
    // console.log(sender);
    // const protocolTokenAddress = web3.utils.toChecksumAddress("0xf1d712736ff2b06dda9ba03d959aa70a297ad99b");

    let lender = aztecAccounts[1];
    let borrower = aztecAccounts[2];
    // let relayer = aztecAccounts[2];
    // let wrangler = aztecAccounts[3];
    let dummy = aztecAccounts[3];
    let dummyPublicKey = dummy.publicKey;
    let salt = "0x7bf20bc9c53493cfd19f9378b1bb9f36ceeee7e76b724efeca38f7d1c96f8a04";

    let newTotMintedViewKey = "0x00";
    let mintedViewKey = "0x00";
    let adjustedNote = null;
    let czkDAIPoolNote = null; // Total czkDAI pool

    let depositOutputNotes = null;

    let zkDAIPoolNote = null;

    before(async () => {
        AdjustSupplyInstance = await JoinSplitFluid.new();
        BilateralSwapInstance = await Swap.new();
        JoinSplitInstance = await JoinSplit.new();
        ACEInstance = await ACE.new();
        await ACEInstance.setCommonReferenceString(constants.CRS);
        await ACEInstance.setProof(MINT_PROOF, AdjustSupplyInstance.address);
        await ACEInstance.setProof(SWAP_PROOF, BilateralSwapInstance.address);
        await ACEInstance.setProof(BURN_PROOF, AdjustSupplyInstance.address);
        // await ACEContract.setProof(DIVIDEND_PROOF, Dividend.address);
        await ACEInstance.setProof(JOIN_SPLIT_PROOF, JoinSplitInstance.address);
        // await ACEContract.setProof(PRIVATE_RANGE_PROOF, PrivateRange.address);

        DAIInstance = await DAI.new({from: accounts[0]});
        MATInstance = await MAT.new({from: accounts[0]});
        cDAIInstance = await cDAI.new({from: accounts[0]});

        // protocolTokenInstance = await LSTProtocolToken.new({from: aztecAccounts});

        zkDAIInstance = await ZkERC20.new(ACEInstance.address, DAIInstance.address, {from: accounts[0]});
        zkMATInstance = await ZkERC20.new(ACEInstance.address, MATInstance.address, {from: accounts[0]});
        czkDAIInstance = await ZkERC20.new(ACEInstance.address, cDAIInstance.address, {from: accounts[0]});

        // KernelInstance = await Kernel.new();
        CompoundDAIMarketInstance = await CompoundDAIMarket.new(zkDAIInstance.address, czkDAIInstance.address, {from: accounts[0]});
    })

    it('should be able to deploy', () => {
        assert.notEqual(CompoundDAIMarketInstance.address, "0x0000000000000000000000000000000000000000");
    });


    it("should convert DAI tokens to zkDAI Notes", async () => {

        // minting DAI tokens for lender 

        let { receipt } = await DAIInstance.mint(lender.address, 200);
        assert.equal(receipt.status, true);

        // Proofs for converting ERC20 tokens to AZTEC notes
        let depositInputNotes = [];
        depositOutputNotes = [await aztec.note.create(lender.publicKey, 100)]
        let depositPublicValue = -100;
        let depositInputOwnerAccounts = [];

        const depositProof = new aztec.JoinSplitProof(depositInputNotes, depositOutputNotes, lender.address, depositPublicValue, lender.address);
        const depositData = depositProof.encodeABI(zkDAIInstance.address);
        const depositSignatures = depositProof.constructSignatures(zkDAIInstance.address, depositInputOwnerAccounts);

        await DAIInstance.approve(ACEInstance.address, -depositPublicValue, {from: lender.address})

        await ACEInstance.publicApprove(zkDAIInstance.address, depositProof.hash, -depositPublicValue, { from: lender.address });
        let tx = await zkDAIInstance.confidentialTransfer(depositData, depositSignatures, { from: lender.address });
        assert.equal(tx.receipt.status, true);

    });
    
    it("should lend zkDAI & receive czkDAI in return", async() => {

        // minting DAI tokens for lender 

        // let { receipt } = await DAIInstance.mint(lender.address, 200);
        // assert.equal(receipt.status, true);

        // // Proofs for converting ERC20 tokens to AZTEC notes
        // let depositInputNotes = [];
        // let depositOutputNotes = [await aztec.note.create(lender.publicKey, 100)]
        // let depositPublicValue = -100;
        // let depositInputOwnerAccounts = [];

        // const convertProof = new aztec.JoinSplitProof(depositInputNotes, depositOutputNotes, lender.address, depositPublicValue, lender.address);
        // const convertData = convertProof.encodeABI(zkDAIInstance.address);
        // const convertSignatures = convertProof.constructSignatures(zkDAIInstance.address, depositInputOwnerAccounts);

        // await DAIInstance.approve(ACEInstance.address, -depositPublicValue, {from: lender.address})

        // await ACEInstance.publicApprove(zkDAIInstance.address, convertProof.hash, -depositPublicValue, { from: lender.address });
        // let tx = await zkDAIInstance.confidentialTransfer(convertData, convertSignatures, { from: lender.address });
        // assert.equal(tx.receipt.status, true);

        // Join split zkDAI from user to contract
        let inputNotes = [depositOutputNotes[0]];
        let outputNotes = [await aztec.note.create(dummyPublicKey, 100)];
        zkDAIPoolNote = outputNotes;
        let publicValue = 0;
        let inputOwnerAccounts = [lender]

        const depositProof = new aztec.JoinSplitProof(inputNotes, outputNotes, lender.address, publicValue, lender.address);
        const depositData = depositProof.encodeABI(zkDAIInstance.address);
        const depositSignatures = depositProof.constructSignatures(zkDAIInstance.address, inputOwnerAccounts);

        await DAIInstance.approve(ACEInstance.address, publicValue, {from: lender.address})

        await ACEInstance.publicApprove(zkDAIInstance.address, depositProof.hash, -publicValue, { from: lender.address });
        tx = await zkDAIInstance.confidentialTransfer(depositData, depositSignatures, { from: lender.address });
        assert.equal(tx.receipt.status, true);

        // Mint czkDAI for user
        // First get exchange rate from contract
        let exchangeRate = await CompoundDAIMarketInstance.getExchangeRate.call();
        // console.log(100 * exchangeRate / 100);
        adjustedNote = await aztec.note.create(lender.publicKey, 100 * exchangeRate / 100);
        mintedViewKey = adjustedNote.getView();
        czkDAIPoolNote = await aztec.note.create(dummyPublicKey, 100 * exchangeRate / 100);
        newTotMintedViewKey = czkDAIPoolNote.getView();
        // console.log(newTotMintedHash);
        let oldTotMinted = await aztec.note.createZeroValueNote();

        let mintProof = new aztec.MintProof(
            oldTotMinted, 
            czkDAIPoolNote, 
            [adjustedNote],
            czkDAIInstance.address,
        );
        const mintData = mintProof.encodeABI();
        tx = await czkDAIInstance.confidentialMint(MINT_PROOF, mintData, {from: accounts[0]});
        assert.equal(tx.receipt.status, true);

    });

    it("should be able to borrow zkDAI using czkDAI as collateral", async () => {
        // Send czkDAI from the borrower to the contract, the contract passes a similar amount of zkDAI
        // to the user. 
        let { receipt } = await cDAIInstance.mint(borrower.address, 200); 
        assert.equal(receipt.status, true);

        // Convert cDAI into czkDAI
        let inputNotes = [];
        let outputNotes = await aztec.note.create(borrower.publicKey, 50); // Reserve factor of 0.5 max
        let publicValue = -50;
        let inputOwners = [];

        const convertProof = new aztec.JoinSplitProof(inputNotes, [outputNotes], borrower.address, publicValue, borrower.address);
        const convertData = convertProof.encodeABI(czkDAIInstance.address);
        const convertSignatures = convertProof.constructSignatures(czkDAIInstance.address, inputOwners);

        await cDAIInstance.approve(ACEInstance.address, -publicValue, {from: borrower.address})

        await ACEInstance.publicApprove(czkDAIInstance.address, convertProof.hash, -publicValue, { from: borrower.address });
        let tx = await czkDAIInstance.confidentialTransfer(convertData, convertSignatures, { from: borrower.address });
        assert.equal(tx.receipt.status, true);

        // Join split czkDAI from borrower to contract
        inputNotes = [outputNotes];
        outputNotes = [await aztec.note.create(dummyPublicKey, 50)];
        // zkDAIPoolNote = outputNotes;
        publicValue = 0;
        inputOwnerAccounts = [borrower]

        const collateralProof = new aztec.JoinSplitProof(inputNotes, outputNotes, borrower.address, publicValue, borrower.address);
        const collateralData = collateralProof.encodeABI(czkDAIInstance.address);
        const collateralSignatures = collateralProof.constructSignatures(czkDAIInstance.address, inputOwnerAccounts);

        await cDAIInstance.approve(ACEInstance.address, publicValue, {from: borrower.address})

        await ACEInstance.publicApprove(czkDAIInstance.address, collateralProof.hash, -publicValue, { from: borrower.address });
        tx = await czkDAIInstance.confidentialTransfer(collateralData, collateralSignatures, { from: borrower.address });
        assert.equal(tx.receipt.status, true);

        // return;
        // Mint czkDAI for user
        // First get exchange rate from contract
        // let exchangeRate = await CompoundDAIMarketInstance.getExchangeRate.call();
        // console.log(100 * exchangeRate / 100);
        inputNotes = zkDAIPoolNote;
        let outputNote1 = await aztec.note.create(borrower.publicKey, 50);
        borrowedNote = outputNote1;
        let outputNote2 = await aztec.note.create(dummy.publicKey, 50);
        zkDAIPoolNote = outputNote2;
        inputOwners = [dummy]

        const borrowProof = new aztec.JoinSplitProof(inputNotes, [outputNote1, outputNote2], dummy.address, publicValue, dummy.address);
        const borrowData =borrowProof.encodeABI(zkDAIInstance.address);
        const borrowSignatures = borrowProof.constructSignatures(zkDAIInstance.address, inputOwners);

        await DAIInstance.approve(ACEInstance.address, publicValue, {from: dummy.address})

        await ACEInstance.publicApprove(zkDAIInstance.address, borrowProof.hash, -publicValue, { from: dummy.address });
        tx = await zkDAIInstance.confidentialTransfer(borrowData, borrowSignatures, { from: dummy.address });
        assert.equal(tx.receipt.status, true);
        // mintedViewKey = adjustedNote.getView();
        // let newTotMinted = await aztec.note.create(dummyPublicKey, 100 * exchangeRate / 100);
        // newTotMintedViewKey = newTotMinted.getView();
        // console.log(newTotMintedHash);
        // let oldTotMinted = await aztec.note.createZeroValueNote();

        // let mintProof = new aztec.MintProof(
        //     oldTotMinted, 
        //     newTotMinted, 
        //     [adjustedNote],
        //     czkDAIInstance.address,
        // );
        // const mintData = mintProof.encodeABI();
        // tx = await czkDAIInstance.confidentialMint(MINT_PROOF, mintData, {from: accounts[0]});
        // assert.equal(tx.receipt.status, true);
    })

    it("should repay borrowed amount with interest", async () => {
        
        let { receipt } = await DAIInstance.mint(borrower.address, 55); 
        assert.equal(receipt.status, true);

        // Convert cDAI into czkDAI
        let inputNotes = [];
        let outputNotes = await aztec.note.create(borrower.publicKey, 55); // Reserve factor of 0.5 max
        let publicValue = -55;
        let inputOwners = [];

        const convertProof = new aztec.JoinSplitProof(inputNotes, [outputNotes], borrower.address, publicValue, borrower.address);
        const convertData = convertProof.encodeABI(zkDAIInstance.address);
        const convertSignatures = convertProof.constructSignatures(zkDAIInstance.address, inputOwners);

        await DAIInstance.approve(ACEInstance.address, -publicValue, {from: borrower.address})

        await ACEInstance.publicApprove(zkDAIInstance.address, convertProof.hash, -publicValue, { from: borrower.address });
        let tx = await zkDAIInstance.confidentialTransfer(convertData, convertSignatures, { from: borrower.address });
        assert.equal(tx.receipt.status, true);
        
        
        // Create zkDAI note of borrow + interest value
        let inputNote1 = outputNotes;
        let outputNote1 = await aztec.note.create(dummy.publicKey, 55);
        publicValue = 0;
        inputOwners = [borrower];

        const repayProof = new aztec.JoinSplitProof([inputNote1], [outputNote1], borrower.address, publicValue, borrower.address);
        const repayData =repayProof.encodeABI(zkDAIInstance.address);
        const repaySignatures = repayProof.constructSignatures(zkDAIInstance.address, inputOwners);

        // await DAIInstance.approve(ACEInstance.address, publicValue, {from: borrower.address})

        // await ACEInstance.publicApprove(zkDAIInstance.address, repayProof.hash, -publicValue, { from: borrower.address });

        tx = await zkDAIInstance.confidentialTransfer(repayData, repaySignatures, { from: borrower.address });
        assert.equal(tx.receipt.status, true); 


        // Create zkDAI note of borrow + interest value
        inputNote1 = outputNote1;
        let inputNote2 = zkDAIPoolNote;
        outputNote1 = await aztec.note.create(dummy.publicKey, 105);
        zkDAIPoolNote = outputNote1;
        publicValue = 0;
        inputOwners = [dummy, dummy];

        const consolidationProof = new aztec.JoinSplitProof([inputNote1, inputNote2], [outputNote1], dummy.address, publicValue, dummy.address);
        const consolidationData = consolidationProof.encodeABI(zkDAIInstance.address);
        const consolidationSignatures = consolidationProof.constructSignatures(zkDAIInstance.address, inputOwners);

        // await DAIInstance.approve(ACEInstance.address, publicValue, {from: borrower.address})

        // await ACEInstance.publicApprove(zkDAIInstance.address, repayProof.hash, -publicValue, { from: borrower.address });

        tx = await zkDAIInstance.confidentialTransfer(consolidationData, consolidationSignatures, { from: dummy.address });
        assert.equal(tx.receipt.status, true); 

        // let inputNote2 = zkDAIPoolNote;
        // let outputNote = await aztec.note.create(dummy.publicKey, 105);
        
        // zkDAIPoolNote = outputNote;
        

        // const repayProof = new aztec.JoinSplitProof([inputNote1, inputNote2], [outputNote], borrower.address, publicValue, borrower.address);
        // const repayData =repayProof.encodeABI(zkDAIInstance.address);
        // const repaySignatures = repayProof.constructSignatures(zkDAIInstance.address, inputOwners);

        // await DAIInstance.approve(ACEInstance.address, publicValue, {from: borrower.address})

        // await ACEInstance.publicApprove(zkDAIInstance.address, repayProof.hash, -publicValue, { from: borrower.address });
        
    })

    it("should redeem zkDAI using czkDAI notes", async () => {
        // Send czkDAI from the user to the contract
        let inputNotes = adjustedNote;
        let outputNotes = await aztec.note.create(dummyPublicKey, inputNotes.k);
        let publicValue = 0;
        let inputOwners = [lender];

        const redeemProof = new aztec.JoinSplitProof([inputNotes], [outputNotes], lender.address, publicValue, lender.address);
        const redeemData = redeemProof.encodeABI(czkDAIInstance.address);
        const redeemSignatures = redeemProof.constructSignatures(czkDAIInstance.address, inputOwners);

        await ACEInstance.publicApprove(czkDAIInstance.address, redeemProof.hash, -publicValue, { from: lender.address });
        let tx = await czkDAIInstance.confidentialTransfer(redeemData, redeemSignatures, { from: lender.address });
        assert.equal(tx.receipt.status, true);

        // Send corresponding (increased) amount of zkDAI to the user
        let exchangeRate = await CompoundDAIMarketInstance.getExchangeRate.call();
        inputNotes = zkDAIPoolNote;
        let outputNote1 = await aztec.note.create(lender.publicKey, 101);
        let outputNote2 = await aztec.note.create(dummyPublicKey, 4);
        publicValue = 0;
        inputOwners = [dummy];

        // console.log(inputNotes, "\n", outputNote1, outputNote2, "\n", inputOwners,"\n", dummy.address);
        // return;

        const redeemProof2 = new aztec.JoinSplitProof([inputNotes], [outputNote1, outputNote2], dummy.address, publicValue, dummy.address);
        // console.log(redeemProof2);
        const redeemData2 = redeemProof2.encodeABI(zkDAIInstance.address);
        // console.log(redeemData2);
        const redeemSignatures2 = redeemProof2.constructSignatures(zkDAIInstance.address, inputOwners);
        // console.log(redeemSignatures2);
        // console.log(zkDAIInstance.address, redeemProof2.hash, -publicValue,redeemData2, redeemSignatures2);
        
        await ACEInstance.publicApprove(zkDAIInstance.address, redeemProof2.hash, -publicValue, { from: dummy.address });
        tx = await zkDAIInstance.confidentialTransfer(redeemData2, redeemSignatures2, { from: dummy.address });
        assert.equal(tx.receipt.status, true);

        // let beforeBurnSupply = await aztec.note.fromViewKey(newTotMintedViewKey);
        // let afterBurnSupply = await aztec.note.createZeroValueNote();
        // let burnProof = new aztec.BurnProof(
        //     beforeBurnSupply,
        //     afterBurnSupply,
        //     [burntNote],
        //     czkDAIInstance.address,
        // );
        // const burnData = burnProof.encodeABI();
        // tx = await czkDAIInstance.confidentialBurn(BURN_PROOF, burnData, {from: accounts[0]});
        // assert.equal(tx.receipt.status, true);

    })

    return;
})
