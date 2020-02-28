pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../ACE/NoteRegistry.sol";
import "../ACE/ACE.sol";
import "./base/ZkAssetBase.sol";

import "../libs/ProofUtils.sol";

/**
 * @title ZkAsset
 * @author AZTEC
 * @dev A contract defining the standard interface and behaviours of a confidential asset.
 * The ownership values and transfer values are encrypted.
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract ZkAsset is ZkAssetBase {

    constructor(
        address _aceAddress,
        address _linkedTokenAddress,
        uint256 _scalingFactor
    ) public ZkAssetBase(
        _aceAddress,
        _linkedTokenAddress,
        _scalingFactor,
        true // Can adjust supply
    ) {
    }

    function confidentialMint(uint24 _proof, bytes calldata _proofData) external {
        require(_proofData.length != 0, "proof invalid");

        (bytes memory _proofOutputs) = ace.mint(_proof, _proofData, address(this));

        (, bytes memory newTotal, ,) = _proofOutputs.get(0).extractProofOutput();

        (, bytes memory mintedNotes, ,) = _proofOutputs.get(1).extractProofOutput();

        (,
        bytes32 noteHash,
        bytes memory metadata) = newTotal.get(0).extractNote();

        logOutputNotes(mintedNotes);
        // emit UpdateTotalMinted(noteHash, metadata);
        
    }

    function confidentialBurn(uint24 _proof, bytes calldata _proofData) external  {
        require(_proofData.length != 0, "proof invalid");

        (bytes memory _proofOutputs) = ace.burn(_proof, _proofData, address(this));
        require(0 == 1, "Here break!");
        (, bytes memory newTotal, ,) = _proofOutputs.get(0).extractProofOutput();

        (, bytes memory burnedNotes, ,) = _proofOutputs.get(1).extractProofOutput();

        (,
        bytes32 noteHash,
        bytes memory metadata) = newTotal.get(0).extractNote();

        logOutputNotes(burnedNotes);
        // emit UpdateTotalBurned(noteHash, metadata);
    }
}
