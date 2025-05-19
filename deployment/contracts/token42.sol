// Create here my Solidity smart contract
// 2 solutions : Inherit from ERC20 Contract or create the hole contract from scratch using BEP20 standard

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ownable.sol";
import "./vesting.sol";
import "./multiSig.sol";


contract Token42 is MyOwnable {

// Data in storage
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    mapping (address => bool) internal _gold_members;// not private and internal to extend this feature in child smart contract

    address public governanceContract;
    address public multiSig;
    address public vestingInvestors;

    uint256 private _totalSupply;
    uint256 private constant _maxSupply = 1_000_000_000;

    string private _name;
    string private _symbol;

// indexed allow to filter in an easy way event when looking into Ethereum logs 
// A token creation (mint) SHOULD trigger a Transfer event with the _from address set to 0x0.
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    modifier onlyGoldMembers() {
        require(_gold_members[msg.sender] == true, "Sender is not gold member");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governanceContract, "Not authorized, only governance is authorized");
        _;
    }

    modifier onlyMultiSig() {
        require(multiSig != address(0), "Multisig not set");
        require(msg.sender == multiSig, "Sender is not multiSig address");
        _;
    }

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;

        address teamWallet = 0x42B95c6e32d50f1FB61Cac1F4d35a2408c883426;
        address airdropWallet = 0x403B6D37503391cdbdf66c9050268a0288C16310;
        address communityWallet = 0x984835c0a2659A1DdeD9C3855Ea8E01f319Fb7DD;
        address investorsWallet = 0xA20216D4De8B681b3864be45495E5cba2EF183ad;
        
        // cast for optimisation in VestingWallet
        vestingInvestors = address(new VestingToken(investorsWallet, uint64(block.timestamp), uint64(2 * 365 days)));

        _mint(teamWallet, 20_000_000);
        _mint(airdropWallet, 20_000_000);
        _mint(communityWallet, 20_000_000);
        _mint(msg.sender, 10_000_000);
        _mint(address(vestingInvestors), 30_000_000);

        // Allow community and team to burn 
        addToGoldMembers(communityWallet);
        addToGoldMembers(teamWallet);
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public pure returns (uint8) {
        return 3;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return _balances[_owner];
    }

    // Return amount that _spender is allowed to spend from _owner account
    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return _allowances[_owner][_spender];
    }

// Public state - modifying functions
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Impossible to transfer to address(0). Use burn");
        _transfer(msg.sender, _to, _value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function _transfer(address _from, address _to, uint256 _value) internal {
        require(_value >= 0, "Amount must be equal or greater than 0 to be transfered");
        require(_balances[_from] >= _value, "Insuficcient balance");

        _balances[_from] -= _value;
        _balances[_to] += _value;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // Check _from has authorized sender to use at least _value from his account
        require(_allowances[_from][msg.sender] >= _value, "Amount must be allowed to be spend");
        _transfer(_from, _to, _value);
        _allowances[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

// Allow _spender to spend _value from msg.sender account
    function approve(address _spender, uint256 _value) public returns (bool success) {
        // Client using approve method SHOULD make sure to create user interfaces clear where _value is first set to 0
        _allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

/********** Added functions extra Sandard BEP20 ************/

    function addToGoldMembers(address _account) onlyOwner public {
        require(_account != address(0), "Impossible to add address(0) to gold members");
        _gold_members[_account] = true;
    }

    function rmToGoldMembers(address _account) onlyOwner public {
        require(_account != address(0), "Impossible to remove address(0) to gold members");
        _gold_members[_account] = false;
    }

    function burn(uint256 _value) onlyGoldMembers external {
        _transfer(msg.sender, address(0), _value);
        _totalSupply -= _value;
        emit Transfer(msg.sender, address(0), _value);
    }

    function mint(address _account, uint256 _value) onlyMultiSig external {
        _mint(_account, _value);
    }

    function _mint(address _account, uint256 _value) internal {
        require(_account != address(0), "Impossible to mint to address(0)");
        require(_totalSupply + _value <= _maxSupply, "Impossible to mint. Total supply would exceed max supply");
        _balances[_account] += _value;
        _totalSupply += _value;

        emit Transfer(address(0), _account, _value);
    }

    // Je rends extensible mon smart contract a une eventuelle Gouvernance pour le futur
    function setGovernanceContract(address _governance) onlyOwner external {
        if (governanceContract != address(0)) {
            rmToGoldMembers(governanceContract);
        }
        governanceContract = _governance;
        addToGoldMembers(_governance);
    }

    function changeOwnerFromGovernance(address _newOwner) onlyGovernance external{
        _transferOwnership(_newOwner);
    }

    function setMultiSig(address _mutliSigAddress) onlyOwner external {
        multiSig = _mutliSigAddress;
    }
}