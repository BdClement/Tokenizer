# Tokenizer

This project is about creating a Token.

I choose to use BNB Smart Chain Testnet that I had to add to my Rabby Wallet. 
I had to obtain Tbnb token from BNB Smart Chain Testnet from a faucet to deploy my smart contract.
The smart contract had to follow BEP-20 standard.
I choose to use Solidity to code the smart contract because BSC is EVM compatible and it is the principal programming language to code smart contract.
To deploy the smart contract, I had to chose a blockchain platfrom that supports creation of tokens. I already used Hardhat and Remix in a previous project so I wanted to discover Truffle 

Standard BEP-20 - explanation 
BEP-20 is a token standard used on the Binance Smart Chain (BSC), similar to Ethereum's ERC-20. It defines a set of rules that fungible tokens must follow to function properly on the BSC.
The main goals of this standard are make easy the token creation compatible with the Binance Smart Chain, ensure interoperability with BSC tools, wallets, DApps, decentralized platforms and provide a familiar framework for Ethereum developers to create token on BSC.

BEP-20 tokens are ERC-20 compatible, cheaper to launch than ERC-20 thanks to low gas cost on BSC.
The differences between Ethereum network and Binance Smart chain are gas cost, speed execution, ecosystems, security.

To meet BEP-20 standard, token smart contract muser include at least these functions :
- function name() public view returns (string)
- function symbol() public view returns (string)
- function decimals() public view returns (uint8)
- function totalSupply() public view returns (uint256)
- function balanceOf(address account) public view returns (uint256)
- function transfer(address recipient, uint256 amount) public returns (bool)
- function allowance(address owner, address spender) public view returns (uint256)
- function approve(address spender, uint256 amount) public returns (bool)
- function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)

These events :
- event Transfer(address indexed from, address indexed to, uint256 value);
- event Approval(address indexed owner, address indexed spender, uint256 value);

https://github.com/bnb-chain/BEPs/blob/master/BEPs/BEP20.md




Alchemy - explanation


Token - explanation
Le Token est un jeton éducatif destiné à simuler des cas d’usage standards de tokens BEP-20 dans un environnement sécurisé. Il permet de tester le mint, transfert, burn et distribution sans aucun enjeu monétaire. Sa seule utilité outre la démonstration éducative sera le système de fidélité. 
Les utilisateurs de mon site en développement seront récompensés en fonction de certaines actions qu'ils font et pourront a terme avoir accès a des features”

Smart contract address : 
Network used : BNB Smart Chain Testnet (ChainID 97, Currency tBNB)
Token contract : 0x21eA36E6120eEcfd62569B2a7e0201350473Ea55


Bonus
A multisignature contract (or multisig) is a security mechanism that requires multiple signatures (validations) for a transaction or critical action to be executed on the blockchain.
It's not designed to control everything, only high-impact actions. It's used for controlling critical functions on smart contract, securing asset for organization, companies, states or even individual, creating decentralized groups that takes fair decision together.
Gnosis Safe, Argent Wallet or OpenZepellin MultiSig are main available solutions today.

I choose to create a MultiSig contract that is extensible for multiple used case. That's the reason why I added receive and fallback funciton so that my contract can receive ETH or BNB to protect value. Thanks to these functions, the MultiSig contract can be used as a safe to lock value on it and use it only if preconfigured settings are filled.
In my case, I protect the mint of my token to assure that minting token is a decision approved by enough actors of the token ecosystem.

multiSig contract : 0xB4C3b9c2F27C1806EfAc3888658716738d6Ef5B4

