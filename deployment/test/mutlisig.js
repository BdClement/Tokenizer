const multiSig = artifacts.require("MultiSigWallet");
const Token42 = artifacts.require("Token42");

const { expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

contract('MultiSigWallet', (accounts) => {
    // Contract's creation for each test
    beforeEach(async () => {
        let authorizedAccounts = new Array(accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]);
        contractInstance = await multiSig.new(3, authorizedAccounts);
    });

    context("Basics security tests on deployment stage", () => {
        it("should create a contract", async () => {
            let authorizedAccounts = new Array(accounts[1], accounts[2], accounts[3]);
            await multiSig.new(2, authorizedAccounts);
            authorizedAccounts.push(accounts[4]);
            authorizedAccounts.push(accounts[5]);
            await multiSig.new(3, authorizedAccounts);
            await multiSig.new(4, authorizedAccounts);
            authorizedAccounts.push(accounts[7]);
            authorizedAccounts.push(accounts[8]);
            await multiSig.new(5, authorizedAccounts);
            await multiSig.new(6, authorizedAccounts);
        });
        it("should revert due to wrong authorized addresses size", async () => {
            let authorizedAccounts = new Array();
            await expectRevert(multiSig.new(2, authorizedAccounts), "Address list must be greater than required signature");

            authorizedAccounts.push(accounts[1]);
            authorizedAccounts.push(accounts[2]);

            await expectRevert(multiSig.new(2, authorizedAccounts), "Address list must be greater than required signature");

            authorizedAccounts.push(accounts[3]);

            await expectRevert(multiSig.new(3, authorizedAccounts), "Address list must be greater than required signature");
            await expectRevert(multiSig.new(5, authorizedAccounts), "Address list must be greater than required signature");
            await expectRevert(multiSig.new(10, authorizedAccounts), "Address list must be greater than required signature");
        });
        it("should revert due to wrong number of signatures required", async () => {
            let authorizedAccounts = new Array(accounts[1], accounts[2], accounts[3]);

            await expectRevert(multiSig.new(0, authorizedAccounts), "Signature required must be betwen minimum 2 and maximum 10");
            await expectRevert(multiSig.new(1, authorizedAccounts), "Signature required must be betwen minimum 2 and maximum 10");
            await expectRevert(multiSig.new(11, authorizedAccounts), "Signature required must be betwen minimum 2 and maximum 10");
            await expectRevert(multiSig.new(255, authorizedAccounts), "Signature required must be betwen minimum 2 and maximum 10");
        });
        it("should revert due to same address given in authorized adrresses", async () => {
            let authorizedAccounts = new Array(accounts[1], accounts[2], accounts[3], accounts[3]);
            await expectRevert(multiSig.new(3, authorizedAccounts), "Address list contains same address multiple times");
        });
        it("should send correct number of authorized address", async () => {
            let nb = await contractInstance.getNbAuthorizedAddress();
            expect(Number(nb)).to.equal(5);

            let authorizedAccounts = new Array(accounts[1], accounts[2], accounts[3]);
            const testContract = await multiSig.new(2, authorizedAccounts);
            nb = await testContract.getNbAuthorizedAddress();
            expect(Number(nb)).to.equal(3);
        });
    });
    context("Receive and fallaback tests", () => {
        it("should receive ETH thanks to receive", async () => {
            await web3.eth.sendTransaction({from: accounts[1], to:contractInstance.address, value: web3.utils.toWei("1", "ether")});
            const multiSigBalance = await web3.eth.getBalance(contractInstance.address);
            expect(multiSigBalance).to.equal(web3.utils.toWei("1", "ether"));
        });
        it("should receive ETH thanks to fallback", async () => {
            const dataUnknown = web3.eth.abi.encodeFunctionCall(
                {
                    name: "UnknownFunction",
                    type: "function",
                    inputs: []//arguments description 
                },
                []//arguments value given to the function
            );
            await web3.eth.sendTransaction({
                from: accounts[1],
                to: contractInstance.address,
                value: web3.utils.toWei("1", "ether"),
                data: dataUnknown
            });
            const multiSigBalance = await web3.eth.getBalance(contractInstance.address);
            expect(multiSigBalance).to.equal(web3.utils.toWei("1", "ether"));
        });
        it("should emit ReceivedCalled event", async () => {
            const resultTx = await web3.eth.sendTransaction({from: accounts[1], to:contractInstance.address, value: web3.utils.toWei("1", "ether")});
            const logs = resultTx.logs;
            expect(logs).to.have.lengthOf(1);
            
            //Le receipt de l'appel d'une fonction a accès a l'abi donc decode directement l'event 
            //Ici on fait une simple transaction en transfer simple donc web3 ne décode pas les le receipt
            //Je recupère donc le hash de la signature de l'event dans topics[0] de mon log
            //Puis je le compare au hash de la signature de l'event
            const topicHash = logs[0].topics[0];
            eventSignHash = await web3.utils.keccak256("ReceivedCalled(uint256)");
            expect(topicHash).to.equal(eventSignHash);
        });
        it("should emit FallbackCalled event", async () => {
            const dataUnknown = web3.eth.abi.encodeFunctionCall(
                {
                    name: "UnknownFunction",
                    type: "function",
                    inputs: []//arguments description 
                },
                []//arguments value given to the function
            );
            const resultTx = await web3.eth.sendTransaction({
                from: accounts[1],
                to: contractInstance.address,
                value: web3.utils.toWei("1", "ether"),
                data: dataUnknown
            });

            const logs = resultTx.logs;
            expect(logs).to.have.lengthOf(1);

            const topicHash = logs[0].topics[0];
            eventSignHash = await web3.utils.keccak256("FallbackCalled(address,uint256,bytes)");
            expect(topicHash).to.equal(eventSignHash);
        });
    });
    context("submitTx tests", () => {
        
        it("should submit a transaction", async () => {
            //Create contract Token BEP20
            const contractToken = await Token42.new("Test42", "TST");
            const abi =  Token42.abi;
            // Create instance of contract web3 to encode fucntion
            const contract = new web3.eth.Contract(abi, contractToken.address);
            const data = contract.methods.mint(accounts[1], 10).encodeABI();

            await contractInstance.submitTx(contractToken.address, 0, data);
        })
        it("should emit a TransactionSubmitted event", async () => {
            const resultSubmitTx = await contractInstance.submitTx(accounts[9], 0, "0x");
            
            const logs = resultSubmitTx.logs;
            expect(logs).to.have.lengthOf(1);
            expect(logs[0].event).to.equal("TransactionSubmitted");
            expect(logs[0].args[0].toString()).to.equal("0");
            expect(logs[0].args[1]).to.equal(accounts[9]);
            expect(logs[0].args[2]).to.equal(accounts[0]);
            expect(logs[0].args[3]).to.equal(null);
        });
        it("should revert because only authorized address can submit transaction", async () => {
            await expectRevert(contractInstance.submitTx(accounts[7], 0, "0x", {from: accounts[8]}), "Not Authorized");
            await contractInstance.submitTx(accounts[7], 0, "0x")

            await expectRevert(contractInstance.submitTx(accounts[7], 0, "0x", {from: accounts[6]}), "Not Authorized");
            await contractInstance.submitTx(accounts[7], 0, "0x", {from: accounts[3]})
        });
    });
    context("confirmTx tests", () => {
        // Fonctionnement simple
        it("should confirm a transaction", async () => {
            const resultSubmitTx = await contractInstance.submitTx(accounts[9], 0, "0x");
            const logs = resultSubmitTx.logs;
            const txId = Number(logs[0].args[0]);

            await contractInstance.confirmTx(txId, {from: accounts[1]});
        });
        it("should emit TransactionSubmitted event", async () => {
            const resultSubmitTx = await contractInstance.submitTx(accounts[9], 0, "0x");
            const logs = resultSubmitTx.logs;
            const txId = Number(logs[0].args[0]);

            const resultConfirmTx = await contractInstance.confirmTx(txId, {from: accounts[1]});
            const logsConfirm = resultConfirmTx.logs;
            expect(logsConfirm).to.have.lengthOf(1);
            expect(logsConfirm[0].event).to.equal("TransactionConfirmed");
            expect(logsConfirm[0].args[0].toString()).to.equal("0");
            expect(logsConfirm[0].args[1].toString()).to.equal("2");
            expect(logsConfirm[0].args[2]).to.equal(accounts[1]);

        });
        it("should revert because only authorized address can confirm transaction", async () => {
            const resultSubmitTx = await contractInstance.submitTx(accounts[9], 0, "0x");
            const logs = resultSubmitTx.logs;
            const txId = Number(logs[0].args[0]);

            await expectRevert(contractInstance.confirmTx(txId, {from: accounts[5]}), "Not Authorized");
        });
        it("should revert beacause txId doesn't correspond any transaction stored", async () => {
            const resultSubmitTx = await contractInstance.submitTx(accounts[9], 0, "0x");     

            await expectRevert(contractInstance.confirmTx(1, {from: accounts[1]}), "Transaction id incorrect");
            await contractInstance.confirmTx(0, {from: accounts[1]});
            await expectRevert(contractInstance.confirmTx(125, {from: accounts[1]}), "Transaction id incorrect");
        });
        it("should revert because signer already signed this transaction", async () => {
            const resultSubmitTx = await contractInstance.submitTx(accounts[9], 0, "0x");
            const logs = resultSubmitTx.logs;
            const txId = Number(logs[0].args[0]);

            await contractInstance.confirmTx(txId, {from: accounts[4]});
            await expectRevert(contractInstance.confirmTx(txId, {from: accounts[4]}), "Signer already signed this transaction");
        });
        it("should revert because signer is the one who submitted the transaction", async () => {
            const resultSubmitTx = await contractInstance.submitTx(accounts[9], 0, "0x");
            const logs = resultSubmitTx.logs;
            const txId = Number(logs[0].args[0]);

            await expectRevert(contractInstance.confirmTx(txId), "Signer already signed this transaction");
        });
        it("should revert because transaction has already been executed", async () => {
            //Create contract Token BEP20
            const contractToken = await Token42.new("Test42", "TST");
            // Set multiSig contract to call mint function
            await contractToken.setMultiSig(contractInstance.address);
            const abi =  Token42.abi;
            // Create instance of contract web3 to encode fucntion
            const contract = new web3.eth.Contract(abi, contractToken.address);
            const data = contract.methods.mint(accounts[1], 10).encodeABI();

            await contractInstance.submitTx(contractToken.address, 0, data);
            await contractInstance.confirmTx(0, {from: accounts[1]});
            await contractInstance.confirmTx(0, {from: accounts[2]});
            await expectRevert(contractInstance.confirmTx(0, {from: accounts[4]}), "Transaction already executed");
        });
    });
    context("execution tests scenario where a transaction is submitted and confirm nbSignRequired times", () => {
        it("should execute mint function, update totalSupply and balance of accounts[1]", async () => {
            //Create contract Token BEP20
            const contractToken = await Token42.new("Test42", "TST");
            let totalSupply = await contractToken.totalSupply();
            let account1Balance = await contractToken.balanceOf(accounts[1]);
            expect(totalSupply.toString()).to.equal("100000000");
            expect(account1Balance.toString()).to.equal("0");
            
            // Set multiSig contract to call mint function
            await contractToken.setMultiSig(contractInstance.address);
            const abi =  Token42.abi;
            // Create instance of contract web3 to encode fucntion
            const contract = new web3.eth.Contract(abi, contractToken.address);
            const data = contract.methods.mint(accounts[1], 10).encodeABI();

            await contractInstance.submitTx(contractToken.address, 0, data);
            await contractInstance.confirmTx(0, {from: accounts[1]});
            await contractInstance.confirmTx(0, {from: accounts[2]});
            
            totalSupply = await contractToken.totalSupply();
            account1Balance = await contractToken.balanceOf(accounts[1]);
            expect(totalSupply.toString()).to.equal("100000010");
            expect(account1Balance.toString()).to.equal("10");

        });
        it("should emit TransactionConfirmed and TransactionExecuted event", async () => {
            //Create contract Token BEP20
            const contractToken = await Token42.new("Test42", "TST");
            
            // Set multiSig contract to call mint function
            await contractToken.setMultiSig(contractInstance.address);
            const abi =  Token42.abi;
            // Create instance of contract web3 to encode fucntion
            const contract = new web3.eth.Contract(abi, contractToken.address);
            const data = contract.methods.mint(accounts[1], 10).encodeABI();

            await contractInstance.submitTx(contractToken.address, 0, data);
            await contractInstance.confirmTx(0, {from: accounts[1]});
            const resultConfirmExecute = await contractInstance.confirmTx(0, {from: accounts[2]});
            const logs = resultConfirmExecute.logs;
            // console.log(logs);
            expect(logs).to.have.lengthOf(2);

            expect(logs[0].event).to.equal("TransactionConfirmed");
            expect(logs[0].args[0].toString()).to.equal("0");
            expect(logs[0].args[1].toString()).to.equal("3");
            expect(logs[0].args[2]).to.equal(accounts[2]);

            expect(logs[1].event).to.equal("TransactionExecuted");
        });
        it("should revert because value doesn't match any function in token42", async () => {
            //Create contract Token BEP20
            const contractToken = await Token42.new("Test42", "TST");
            let totalSupply = await contractToken.totalSupply();
            let account1Balance = await contractToken.balanceOf(accounts[1]);
            expect(totalSupply.toString()).to.equal("100000000");
            expect(account1Balance.toString()).to.equal("0");
            
            const abi =  Token42.abi;
            // Create instance of contract web3 to encode fucntion
            const contract = new web3.eth.Contract(abi, contractToken.address);
            const data = "0x";
            await contractInstance.submitTx(contractToken.address, 0, data);
            await contractInstance.confirmTx(0, {from: accounts[1]});
            await expectRevert(contractInstance.confirmTx(0, {from: accounts[2]}),"Transacton failed");
        });
        it("should revert because multiSig address is not set in token42", async () => {
            //Create contract Token BEP20
            const contractToken = await Token42.new("Test42", "TST");
            let totalSupply = await contractToken.totalSupply();
            let account1Balance = await contractToken.balanceOf(accounts[1]);
            expect(totalSupply.toString()).to.equal("100000000");
            expect(account1Balance.toString()).to.equal("0");
            
            const abi =  Token42.abi;
            // Create instance of contract web3 to encode fucntion
            const contract = new web3.eth.Contract(abi, contractToken.address);
            const data = contract.methods.mint(accounts[1], 10).encodeABI();
            await contractInstance.submitTx(contractToken.address, 0, data);
            await contractInstance.confirmTx(0, {from: accounts[1]});
            await expectRevert(contractInstance.confirmTx(0, {from: accounts[2]}),"Transacton failed");
        });   
    });
});