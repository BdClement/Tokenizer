// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/finance/VestingWallet.sol";

contract VestingToken is VestingWallet {
    // parent constructor called before child constructor so he needs corrects arguments
    constructor(address beneficiary, uint64 startTimestamp, uint64 durationSeconds) 
        VestingWallet(beneficiary, startTimestamp, durationSeconds) {}

    event BEP20Released(address indexed token, uint256 amount);

// override release to emit BEP20Released event instead of ERC20
    function release(address token) public override {
        uint256 amount = releasable(token);
        super.release(token);
        emit BEP20Released(address(token), amount);
    }
}