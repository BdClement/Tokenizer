const MyOwnable = artifacts.require("MyOwnable");

const { expectRevert } = require('@openzeppelin/test-helpers');

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

contract('MyOwnable', (accounts) => {
    beforeEach(async () => {
        contractInstance = await MyOwnable.new();
        // contractTx = await web3.eth.getTransactionReceipt(contractInstance.transactionHash);
        // Receipt from constructor is not decoded as a simple function
    });

    it("should set an owner with constructor", async () => {
        const owner = await contractInstance.getOwner();
        expect(owner).to.equal(accounts[0]);
    });
    it("should transfer ownership", async () => {
        await contractInstance.transferOwnership(accounts[1]);
        const owner = await contractInstance.getOwner();
        expect(owner).to.equal(accounts[1]);
    });
    it("should emit an OwnerShipTransferred event", async () => {
        const resultTransferOwnership = await contractInstance.transferOwnership(accounts[1]);
        const logs = resultTransferOwnership.logs;
        expect(logs[0].event).to.equal("OwnerShipTransferred");
        expect(logs[0].args[0]).to.equal(accounts[0]);
        expect(logs[0].args[1]).to.equal(accounts[1]);
    });
    it("should renounceOwnership", async () => {
        await contractInstance.renounceOwnership();
        const owner = await contractInstance.getOwner();
        expect(owner).to.equal(ZERO_ADDRESS);
    });
    it("should revert transferOwnership", async () => {
        await expectRevert(contractInstance.transferOwnership(accounts[1], {from: accounts[2]}), "Sender is not the _owner !");
    });
    it("should revert after transferOwnership", async () => {
        await contractInstance.transferOwnership(accounts[1]);
        let owner = await contractInstance.getOwner();
        expect(owner).to.equal(accounts[1]);
        await expectRevert(contractInstance.transferOwnership(accounts[1]), "Sender is not the _owner !");

        await contractInstance.transferOwnership(accounts[0], {from: accounts[1]});
        owner = await contractInstance.getOwner();
        expect(owner).to.equal(accounts[0]);
        
        await contractInstance.transferOwnership(accounts[1]);
        owner = await contractInstance.getOwner();
        expect(owner).to.equal(accounts[1]);
    });
    it("should revert renounceOwnership", async () => {
        await expectRevert(contractInstance.renounceOwnership({from: accounts[2]}), "Sender is not the _owner !");
    });
    it("should revert after renouncing to Ownership", async () => {
        await contractInstance.renounceOwnership();
        await expectRevert(contractInstance.renounceOwnership(), "Sender is not the _owner !");
    });
});