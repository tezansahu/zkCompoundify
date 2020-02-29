pragma solidity ^0.5.7;

import "./AZTEC/libs/NoteUtils.sol";
import "./ZkERC20.sol";

contract CompoundDAIMarket{
    using NoteUtils for bytes;

    uint private exchangeRate = 100;

    struct Note{
        address owner;
        bytes32 noteHash;
    }

    address zkDAI;
    address czkDAI;

    constructor(address _zkDAI, address _czkDAI) public {
        zkDAI = _zkDAI;
        czkDAI = _czkDAI;
    }

    function getExchangeRate() public view returns(uint){
        return exchangeRate;
    }

    function updateExchangeRate() internal {
        exchangeRate = exchangeRate + 5;
    }

    function borrow() public {
        updateExchangeRate();
    }


}