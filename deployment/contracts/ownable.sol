// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "hardhat/console.sol";

contract MyOwnable {

    address private _owner;

    event OwnerShipTransferred(address indexed _lastOwner, address indexed _newOwner);

    constructor() {
        _owner = msg.sender;
        emit OwnerShipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Sender is not the _owner !");
        _;
    }

    function transferOwnership(address _newOwner) onlyOwner public {
        _transferOwnership(_newOwner);
    }

    function _transferOwnership(address _newOwner) internal {
        _owner = _newOwner;
        emit OwnerShipTransferred(msg.sender, _owner);
    }

	function getOwner() public view returns (address){
		return _owner;
	}

    function renounceOwnership() onlyOwner public {
        transferOwnership(address(0));
    }
}