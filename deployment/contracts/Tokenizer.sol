// Create here my Solidity smart contract
// 2 solutions : Inherit from ERC20 Contract or create the hole contract from scratch using BEP20 standard

pragma solidity ^0.8.0;

contract HelloWorld {

    string public sentence;

    constructor() {
        sentence = "HelloWorld !";
    }

    function saySomething() public view returns(string memory){
        return (sentence);
    }
}
