// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ownable.sol";

contract MultiSigWallet {

    struct Transaction {
        // packing in a slot (32bytes)
        uint64 txId;
        uint64 nbSigned;
        bool executed;
        uint256 value;//ETH to transfer in transaction (0 for mint)
        address target;
        address[] signers;//couple to mapping for optimisation 
        mapping(address => bool) isSigner;
        bytes data;//encoded data representing the function call
    }

    address[] private _authorizedSigners;
    mapping(address => bool) private _isAuthorizedSigner;
    uint8 public nbSignRequired;
    Transaction[] private _transactions;

    event TransactionSubmitted(uint256 _txId, address _to, address _signer, bytes _data);
    event TransactionConfirmed(uint256 _txId, uint256 _nbConfirmation, address _signer);
    event TransactionExecuted();
    event ReceivedCalled(uint256 _amount);
    event FallbackCalled(address indexed _sender, uint256 _amount, bytes _data);

    modifier onlyAuthorized() {
        require(_isAuthorizedSigner[msg.sender] == true, "Not Authorized");
        _;
    }

    constructor(uint8 nbSignRequired_, address[] memory authorizedSign_) {
        require(nbSignRequired_ > 1 && nbSignRequired_ <= 10, "Signature required must be betwen minimum 2 and maximum 10");
        require(authorizedSign_.length > nbSignRequired_, "Address list must be greater than required signature");
        _authorizedSigners = authorizedSign_;

        // copying authorized addresses in a mapping variable to enhance access
        for (uint i = 0; i < authorizedSign_.length; i++) {
            require(_isAuthorizedSigner[authorizedSign_[i]] == false,  "Address list contains same address multiple times");
            _isAuthorizedSigner[authorizedSign_[i]] = true;
        }
        // _target = target_;
        nbSignRequired = nbSignRequired_;
    }

/***** receive and fallback function are used to allow my contract to receive ETH/BNB and be extensible for other usecase *****/
/***** In our case, my contract is used to secure mint function that doen't include value specification *****/
/***** But in case we need to secure a function that involves ETH/BNB transfer, it will be possible thanks to those functions *****/

// receive will be called to receive some ETH/BNB by a call without data, only value specified
    receive() external payable {
        emit ReceivedCalled(msg.value);
    }

// fallaback will be used to receive some ETH/BNB by a call specifying value but with unknown data
    fallback() external payable {
        emit FallbackCalled(msg.sender, msg.value, msg.data);
    }

    function getNbAuthorizedAddress() public view returns (uint256){
        return _authorizedSigners.length;
    }

// to => contrat target / _value => Eth value in the call function / Data => abi.encodeWithSelector
    function submitTx(address _to, uint256 _value, bytes calldata _data) onlyAuthorized external {
        _transactions.push();
        uint64 txId = uint64(_transactions.length - 1);
        require(txId <= type(uint64).max, "Index exceeds uint64 max");

        _transactions[txId].txId = txId;
        _transactions[txId].nbSigned = 1;
        _transactions[txId].value = _value;
        _transactions[txId].target = _to;
        _transactions[txId].signers.push(msg.sender);
        _transactions[txId].isSigner[msg.sender] = true;
        _transactions[txId].data = _data;
        
        emit TransactionSubmitted(txId, _to, msg.sender, _data);
    }

    function confirmTx(uint64 _txId) onlyAuthorized external{
        require(_txId < _transactions.length, "Transaction id incorrect");
        Transaction storage transaction = _transactions[_txId];
        require(!transaction.isSigner[msg.sender], "Signer already signed this transaction");
        require(!transaction.executed, "Transaction already executed");
        transaction.nbSigned++;
        transaction.signers.push(msg.sender);
        transaction.isSigner[msg.sender] = true;

        emit TransactionConfirmed(_txId, transaction.nbSigned, msg.sender);

        if (transaction.nbSigned >= nbSignRequired) {
            _executeTx(_txId);
            transaction.executed = true;
        }
    }

    function _executeTx(uint64 _txId) internal {
        Transaction storage transaction = _transactions[_txId];
        // (bool success, bytes memory result) result here is useless because mint from token42 dosen't return anything
        // {} are used to customize low level call() such as value, gas etc
        
        (bool success, ) = transaction.target.call{value: transaction.value}(transaction.data);
        require(success, "Transacton failed");
        emit TransactionExecuted();
    }
    // I choose a non flexible multiSig contract to maximise security : to make a change on multiSig setting you will need to redeploy an instance of that contract
}

