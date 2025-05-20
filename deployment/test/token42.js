const Token42 = artifacts.require("Token42");
const VestingToken = artifacts.require("VestingToken");

// Trying to use chai-bn plugin to compare big number directly
const chai = require('chai');
const BN = web3.utils.BN;
const chaiBN = require('chai-bn')(BN);
// const chaiAsPromised = require("chai-as-promised");
const { expectRevert } = require('@openzeppelin/test-helpers');
chai.use(chaiBN);
// chai.use(chaiAsPromised);
// import explicite de chai pour s'assurer que l'instance de expect utilise des fonctionnalités etendues au plugin chai-nb comme bignumber
const { expect } = chai;
const { time } = require('@openzeppelin/test-helpers');

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const TEAM_ADDRESS = "0x42B95c6e32d50f1FB61Cac1F4d35a2408c883426";
const AIRDROP_ADDRESS = "0x403B6D37503391cdbdf66c9050268a0288C16310";
const COMMUNITY_ADDRESS = "0x984835c0a2659A1DdeD9C3855Ea8E01f319Fb7DD";
const INVESTORS_ADDRESS = "0xA20216D4De8B681b3864be45495E5cba2EF183ad";


contract('Token42', (accounts) => {
    // Contract's creation for each test
    beforeEach(async () => {
        contractInstance = await Token42.new("Test42", "TST");
        contractTx = await web3.eth.getTransactionReceipt(contractInstance.transactionHash);
    });

    context("Basics tests on deployment stage", () => {
        it("Should have a correct name", async () => {
            expect(await contractInstance.name()).to.equal("Test42");
        });
        it("Should have a correct symbol", async () => {
            expect(await contractInstance.symbol()).to.equal("TST");
        });
        it("Should have correct totalSupply", async () => {
            const supply = await contractInstance.totalSupply();
            expect(supply.toString()).to.equal("100000000000");//convert in string type to compare
        });
        it("Should have correct decimals", async () => {
            const decimals = await contractInstance.decimals();
            expect(Number(decimals)).to.equal(3);//Compare JS Number when we sure Number is small
            expect(decimals).to.be.bignumber.equal(new BN(3));//compare directly numbers thanks to BN but need to install plugin
        });
    });

    context("Allocation tests on deployment stage", () => {
        it("Team should have the correct initial allocation", async () => {
            const teamAllocation = await contractInstance.balanceOf(TEAM_ADDRESS);
            expect(teamAllocation.toString()).to.equal("20000000000");
        });
        it("Airdrop wallet should have the correct initial allocation", async () => {
            const airdropAllocation = await contractInstance.balanceOf(AIRDROP_ADDRESS);
            expect(airdropAllocation.toString()).to.equal("20000000000");
        });
        it("Community should have the correct initial allocation", async () => {
            const communityAllocation = await contractInstance.balanceOf(COMMUNITY_ADDRESS);
            expect(communityAllocation.toString()).to.equal("20000000000");
        });
        it("Owner should have the correct initial allocation", async () => {
            const ownerAllocation = await contractInstance.balanceOf(accounts[0]);
            expect(ownerAllocation.toString()).to.equal("10000000000");
        });
        it("Investors should have the correct initial allocation", async () => {
            const vestingContract = await contractInstance.vestingInvestors();
            const investorsAllocation = await contractInstance.balanceOf(vestingContract);
            expect(investorsAllocation.toString()).to.equal("30000000000");
        });
        it("should emit a Transfer event with _from set at address(0)", async () => {
            const logs = contractTx.logs;
            SignHashTransfer = await web3.utils.keccak256("Transfer(address,address,uint256)");
            expect(logs[4].topics[0]).to.equal(SignHashTransfer);
        });
    });

    context("Approve and allowance features", () => {
        it("allowance should be set by default to zero", async () => {
            const allowance = await contractInstance.allowance(accounts[0], TEAM_ADDRESS);
            expect(allowance.toString()).to.equal("0");
        });
        it("allowance can be set with approve", async () => {
            let allowance = await contractInstance.allowance(accounts[0], accounts[1]);
            expect(allowance.toString()).to.equal("0");

            await contractInstance.approve(accounts[1], 5000000);
            allowance = await contractInstance.allowance(accounts[0], accounts[1]);
            expect(allowance.toString()).to.equal("5000000");
        });
        it("approve multiple times should overide allowance", async () => {
            await contractInstance.approve(accounts[1], 5000000);
            let allowance = await contractInstance.allowance(accounts[0], accounts[1]);
            expect(allowance.toString()).to.equal("5000000");

            await contractInstance.approve(accounts[1], 7000000);
            allowance = await contractInstance.allowance(accounts[0], accounts[1]);
            expect(allowance.toString()).to.equal("7000000");

            await contractInstance.approve(accounts[1], 1000000);
            allowance = await contractInstance.allowance(accounts[0], accounts[1]);
            expect(allowance.toString()).to.equal("1000000");
        });
        it("should emit an Approval event while calling approve", async () => {
            const resultApprove = await contractInstance.approve(accounts[1], 5000000);
            const logs = resultApprove.logs;
            expect(logs).to.have.lengthOf(1);
            expect(logs[0].event).to.equal("Approval");
            expect(logs[0].args[0]).to.equal(accounts[0]);
            expect(logs[0].args[1]).to.equal(accounts[1]);
            expect(logs[0].args[2].toString()).to.equal("5000000");
        });
    });

    context("Simple transfer feature tests", () => {
        it("should be possible and update balances", async() => {
            let balanceOwner = await contractInstance.balanceOf(accounts[0]);
            expect(balanceOwner.toString()).to.equal("10000000000")
            let balanceAccount1 = await contractInstance.balanceOf(accounts[1]);
            expect(balanceAccount1.toString()).to.equal("0")
            
            await contractInstance.transfer(accounts[1], 5);
            
            balanceOwner = await contractInstance.balanceOf(accounts[0]);
            expect(balanceOwner.toString()).to.equal("9999999995");
            balanceAccount1 = await contractInstance.balanceOf(accounts[1]);
            expect(balanceAccount1.toString()).to.equal("5")
        });
        it("should be possible to transfer a 0 amount", async () => {
            let balanceOwner = await contractInstance.balanceOf(accounts[0]);
            expect(balanceOwner.toString()).to.equal("10000000000")
            let balanceAccount1 = await contractInstance.balanceOf(accounts[1]);
            expect(balanceAccount1.toString()).to.equal("0");
            
            await contractInstance.transfer(accounts[1], 0);
            
            balanceOwner = await contractInstance.balanceOf(accounts[0]);
            expect(balanceOwner.toString()).to.equal("10000000000")
            balanceAccount1 = await contractInstance.balanceOf(accounts[1]);
            expect(balanceAccount1.toString()).to.equal("0")
        });
        it("shouldn't modify totalSupply", async () => {
            const initialSupply = await contractInstance.totalSupply();
            expect(initialSupply.toString()).to.equal("100000000000");

            await contractInstance.transfer(accounts[1], 5);
            
            const supplyAfterTransfer = await contractInstance.totalSupply();
            expect(supplyAfterTransfer.toString()).to.equal("100000000000");
        });
        it("should emit a Transfer Event", async () => {
            const resultTransfer = await contractInstance.transfer(accounts[1], 5);
            const logs = resultTransfer.logs;
            expect(logs).to.have.lengthOf(1);
            expect(logs[0].event).to.equal("Transfer");
            expect(logs[0].args[0]).to.equal(accounts[0]);
            expect(logs[0].args[1]).to.equal(accounts[1]);
            expect(logs[0].args[2].toString()).to.equal("5");
        });
        it("should revert a tranfer to address(0)", async () => {
            await expectRevert(contractInstance.transfer(ZERO_ADDRESS, 5), "Impossible to transfer to address(0). Use burn");
        });
        it("should revert a transfer when caller has insuficcient balance", async () => {
            await expectRevert(contractInstance.transfer(accounts[0], 10, {from: accounts[1]}), "Insuficcient balance");
            await expectRevert(contractInstance.transfer(accounts[1], 10000001000), "Insuficcient balance");
            await expectRevert(contractInstance.transfer(accounts[0], 1, {from: accounts[4]}), "Insuficcient balance");
        });
    });

    context("Transfer with approval tests", () => {
        it("should be possible for caller who is allowed ans update balances", async () => {
            let balanceOwner = await contractInstance.balanceOf(accounts[0]);
            expect(balanceOwner.toString()).to.equal("10000000000")
            let balanceAccount1 = await contractInstance.balanceOf(accounts[1]);
            expect(balanceAccount1.toString()).to.equal("0");

            await contractInstance.approve(accounts[1], 50);
            await contractInstance.transferFrom(accounts[0], accounts[1], 50, {from : accounts[1]});
            
            balanceOwner = await contractInstance.balanceOf(accounts[0]);
            expect(balanceOwner.toString()).to.equal("9999999950");
            balanceAccount1 = await contractInstance.balanceOf(accounts[1]);
            expect(balanceAccount1.toString()).to.equal("50");
        });
        it("should emit an Approval and a Transfer Event", async () => {
            const resultApprove = await contractInstance.approve(accounts[1], 50);
            const resultTransferFrom = await contractInstance.transferFrom(accounts[0], accounts[1], 50, {from : accounts[1]});

            const logsApprove = resultApprove.logs;
            expect(logsApprove).to.have.lengthOf(1);
            expect(logsApprove[0].event).to.equal("Approval");
            expect(logsApprove[0].args[0]).to.equal(accounts[0]);
            expect(logsApprove[0].args[1]).to.equal(accounts[1]);
            expect(logsApprove[0].args[2].toString()).to.equal("50");

            const logsTransferFrom = resultTransferFrom.logs;
            expect(logsTransferFrom).to.have.lengthOf(1);
            expect(logsTransferFrom[0].event).to.equal("Transfer");
            expect(logsTransferFrom[0].args[0]).to.equal(accounts[0]);
            expect(logsTransferFrom[0].args[1]).to.equal(accounts[1]);
            expect(logsTransferFrom[0].args[2].toString()).to.equal("50");
        });
        it("should revert for caller who is not allowed", async () => {
            await expectRevert(contractInstance.transferFrom(accounts[0], accounts[1], 50, {from : accounts[1]}), "Amount must be allowed to be spend");
        });
        it("should revert for caller who is allowed but try to transfer more than allowed amount", async () => {
            await contractInstance.approve(accounts[1], 50);
            await expectRevert(contractInstance.transferFrom(accounts[0], accounts[1], 51, {from : accounts[1]}), "Amount must be allowed to be spend");

            await contractInstance.transferFrom(accounts[0], accounts[1], 25, {from : accounts[1]});
            await expectRevert(contractInstance.transferFrom(accounts[0], accounts[1], 26, {from : accounts[1]}), "Amount must be allowed to be spend");

            await contractInstance.transferFrom(accounts[0], accounts[1], 25, {from : accounts[1]});
            await expectRevert(contractInstance.transferFrom(accounts[0], accounts[1], 1, {from : accounts[1]}), "Amount must be allowed to be spend");
        });   
    });

    context("OnlyOwner privileges tests", () => {
        it("should add address to GoldMembers", async () => {
            await contractInstance.addToGoldMembers(accounts[1]);
            await contractInstance.transfer(accounts[1], 10);
            await contractInstance.burn(10, {from: accounts[1]});
        });
        it("should revert while adding to GoldMembers", async () => {
            await expectRevert(contractInstance.addToGoldMembers(accounts[1], {from: accounts[1]}), "Sender is not the _owner !");
        });
        it("should remove address from GoldMembers", async () => {
            await contractInstance.addToGoldMembers(accounts[1]);
            await contractInstance.rmToGoldMembers(accounts[1]);
        });
        it("should revert while removing address from GoldMembers", async () => {
            await expectRevert(contractInstance.rmToGoldMembers(accounts[1], {from: accounts[1]}), "Sender is not the _owner !");
        });
        it("should set governance contract and updating GoldMembers status", async () => {
            //Governance is GoldMember
            await contractInstance.transfer(accounts[7], 20);
            await contractInstance.setGovernanceContract(accounts[7]);
            expect(await contractInstance.governanceContract()).to.equal(accounts[7]);
            await contractInstance.burn(10, {from: accounts[7]});

            //Governance has changed and is not GoldMember anymore
            await contractInstance.setGovernanceContract(accounts[8]);
            expect(await contractInstance.governanceContract()).to.equal(accounts[8]);
            await expectRevert(contractInstance.burn(10, {from: accounts[7]}), "Sender is not gold member");

        });
        it("should revert while setting governance contract", async () => {
            await expectRevert(contractInstance.setGovernanceContract(accounts[7], {from: accounts[1]}), "Sender is not the _owner !");
        });
        it("should set multisig address", async () => {
            await contractInstance.setMultiSig(accounts[8]);
            expect(await contractInstance.multiSig()).to.equal(accounts[8]);
        });
        it("should revert while setting multisig address", async () => {
            await expectRevert(contractInstance.setMultiSig(accounts[8], {from: accounts[1]}), "Sender is not the _owner !");
        });
    });

    context("OnlyMultiSig privileges tests", () => {
        it("should mint some token", async () => {
            await contractInstance.setMultiSig(accounts[8]);
            await contractInstance.mint(TEAM_ADDRESS, 10, {from: accounts[8]});
        });
        it("should update totalSupply and balances after minting", async () => {
            await contractInstance.setMultiSig(accounts[8]);
            await contractInstance.mint(TEAM_ADDRESS, 1, {from: accounts[8]});

            const teambalance = await contractInstance.balanceOf(TEAM_ADDRESS);
            const totalSupply = await contractInstance.totalSupply();
            expect(teambalance.toString()).to.equal("20000000001");
            expect(totalSupply.toString()).to.equal("100000000001");
        });
        it("should revert while attempting to mint while multiSig hasn't been set", async () => {
            await expectRevert(contractInstance.mint(TEAM_ADDRESS, 10), "Multisig not set");
        });
        it("should revert while attempting to mint while multiSig has been set", async () => {
            await contractInstance.setMultiSig(accounts[8]);
            await expectRevert(contractInstance.mint(TEAM_ADDRESS, 10), "Sender is not multiSig address");
        });
        it("should revert while attempting mint to get supply greater than maxSupply", async () => {
            await contractInstance.setMultiSig(accounts[8]);
            await expectRevert(contractInstance.mint(TEAM_ADDRESS, 1000000000000, {from: accounts[8]}), "Impossible to mint. Total supply would exceed max supply");
        });
        it("should revert while minting to address(0)", async () => {
            await contractInstance.setMultiSig(accounts[8]);
            await expectRevert(contractInstance.mint(ZERO_ADDRESS, 1, {from: accounts[8]}), "Impossible to mint to address(0)");
        });
    });

    context("OnlyGoldMembers privileges tests", () => {
        it("should burn some token", async () => {
            await contractInstance.addToGoldMembers(accounts[0]);
            await contractInstance.burn(10, {from: accounts[0]});
        });
        it("should update totalSupply and balance", async () => {
            await contractInstance.addToGoldMembers(accounts[0]);
            await contractInstance.burn(10, {from: accounts[0]});
            const ownerBalance = await contractInstance.balanceOf(accounts[0]);
            const totalSupply = await contractInstance.totalSupply();
            expect(ownerBalance.toString()).to.equal("9999999990");
            expect(totalSupply.toString()).to.equal("99999999990");

        });
        it("should revert while attempting to burn token", async () => {
            await expectRevert(contractInstance.burn(10), "Sender is not gold member");
        });
    });
    
    context("Governance contract feature tests", () => {
        it("Governance should not be set at the beginning", async () => {
            expect(await contractInstance.governanceContract()).to.equal(ZERO_ADDRESS);
        });
        it("Governance can be set by owner", async () => {
            await contractInstance.setGovernanceContract(TEAM_ADDRESS);
            expect(await contractInstance.governanceContract()).to.equal(TEAM_ADDRESS);
        });
        it("Governance become goldMembers and can burn token thanks to that privilege", async () => {
            const governance = accounts[5];
            await contractInstance.setGovernanceContract(governance);
            await contractInstance.burn(0, { from: governance });
        });
        it("Governance can change owner of the contract", async () => {
            const governance = accounts[5];
            await contractInstance.setGovernanceContract(governance);
            expect(await contractInstance.getOwner()).to.equal(accounts[0]);
            await contractInstance.changeOwnerFromGovernance(accounts[1], { from: governance });
            expect(await contractInstance.getOwner()).to.equal(accounts[1]);
        });
        it("should revert while attempting changing ownership from changeOwnerFromGovernance", async () => {
            await expectRevert(contractInstance.changeOwnerFromGovernance(accounts[1]), "Not authorized, only governance is authorized");
        });
    });
    
    context("Investor's vesting tests", () => {
        it("should free part of investor's allocation depending the time", async () => {
            const tokenAddress = contractInstance.address;
            const vestingAddress = await contractInstance.vestingInvestors();
            const vestingContract = await VestingToken.at(vestingAddress);

            await vestingContract.release(tokenAddress);
            let investorsBalance = await contractInstance.balanceOf(INVESTORS_ADDRESS);
            expect(investorsBalance.toString()).to.equal("0");
            
            await time.increase(time.duration.days(50));

            await vestingContract.release(tokenAddress);
            investorsBalance = await contractInstance.balanceOf(INVESTORS_ADDRESS);
            expect(investorsBalance.toString()).to.not.be.equal("0");

            await time.increase(time.duration.days(365 * 2));
            await vestingContract.release(tokenAddress);
            investorsBalance = await contractInstance.balanceOf(INVESTORS_ADDRESS);
            expect(investorsBalance.toString()).to.equal("30000000000");
        });
        it("should emit BEP20Released event", async () => {
            const tokenAddress = contractInstance.address;
            const vestingAddress = await contractInstance.vestingInvestors();
            const vestingContract = await VestingToken.at(vestingAddress);

            const resultRelease = await vestingContract.release(tokenAddress);
            const logs = resultRelease.logs

            expect(logs).to.have.lengthOf(2);//ERC20 event + BEP20 
            expect(logs[1].event).to.equal("BEP20Released");
            expect(logs[1].args[0]).to.equal(tokenAddress);
        });
    });
});

//Tests des erreurs to.throw(type ??) OU excpect.fail()