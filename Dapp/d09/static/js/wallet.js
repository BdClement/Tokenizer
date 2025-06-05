// import { ethers } from "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js";//CDN Bloqué
import { ethers } from "https://unpkg.com/ethers@5.7.2/dist/ethers.esm.min.js";//CDN non bloqué
import { getProvider, getContract, getReadOnlyContract } from "./init-wallet.js";

console.log('ethers.js loaded');
const BscTesnetChainId = 97;
let txPending = false;

$(document).ready(async function() {
    console.log("Document Ready");
    const connectDisplay = $("#connect-display");
    const walletConnection = $("#connect-wallet");
    const disconnectDisplay = $("#disconnect-display");
    const walletDisconnection = $("#disconnect-wallet");
    const balanceDisplay = $("#balance-display");

    const formDisplay = $("#form-display");
    const formEvent = $("#form-event");

    const transfer = $("#transfer");
    const approve = $("#approve");
    const transferFrom = $("#transfer-from");

    if (localStorage.getItem('userAddress') !== null) {
        disconnectDisplay.removeClass("d-none");
        connectDisplay.addClass("d-none");
        await updateBalance();
    }
    
    async function updateBalance() {
        const user = localStorage.getItem('userAddress');
        console.log('getUser in update');
        if (user !== null) {
            console.log(' in update in if');
            const contract = getReadOnlyContract();
            console.log('getcontractReadOnly in update');
            const balanceExt = await contract.balanceOf(user);
            console.log('getBalance in update');
            const amount = ethers.utils.formatUnits(balanceExt, 3);
            console.log('getformatUnits in update');
            localStorage.setItem('balance', amount);
            balanceDisplay.html(`<p class="lead mt-auto">$EXT balance : ${amount} EXT</p>`);
        }
    }

    async function connectWallet() {
        const provider = getProvider();
        const network = await provider.getNetwork();
        if (network.chainId != BscTesnetChainId) {
            try {
                //appel plus bas niveau qu'avec ethers.js
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{chainId: '0x61'}],// 97 BscTesnet
                });
            } catch (switchError) {
                throw new Error("Impossible to change chain to Bsc Tesnet. Make sure you are connected and have added this network to your wallet !");
            }
        }

        const resultAccounts = await provider.send("eth_requestAccounts", []);
        if (resultAccounts.length > 0) {
            localStorage.setItem('userAddress', resultAccounts[0]);
        }
        await updateBalance();
    }
    
    async function handleConnectWallet(event) {
        console.log('handleConnectWallet');
        event.preventDefault();

        if (localStorage.getItem('userAddress') !== null) {
            showToast('A wallet is already connected. Disconnect wallet to connect an other one.', 'warning');
        } 
        else if (typeof window.ethereum !== 'undefined' && window.ethereum.isRabby) {
            try {
                await connectWallet();
                connectDisplay.addClass("d-none");
                disconnectDisplay.removeClass("d-none");
            } catch (error) {
                showToast(`Connect wallet error : ${error.message}`, 'danger');
            }
        }
        else {
            showToast('Rabby needs to be installed.', 'warning');
        }
    }

    function handleDisconnectWallet(event = null) {
        if (event) {
            event.preventDefault();
        }
        connectDisplay.removeClass("d-none");
        disconnectDisplay.addClass("d-none");

        localStorage.removeItem('userAddress');
        localStorage.removeItem('balance');
    }

    function setForm(action) {
        if (action === 'transfer') {
            formEvent.html(`
                <fieldset class="d-flex flex-column flex-grow-1 justify-content-center align-items-center">
                    <legend class="m-3 ">Make a Transfer</legend>
                        <input type="text" class="form-control m-3" id="to" placeholder="To">
                        <span id="to-error" class="d-none"></span>
                        <input type="text" class="form-control m-3" id="amount" placeholder="Amount">
                        <span id="amount-error" class="d-none"></span>
                        <button type="submit" class="btn btn-primary m-3">Transfer</button>
                </fieldset>`);
            formEvent.off("submit").on("submit", handleTransfer);
        } else if (action === 'approve') {
            formEvent.html(`
                <fieldset class="d-flex flex-column flex-grow-1 justify-content-center align-items-center">
                    <legend class="m-3 ">Make an Approval</legend>
                    <input type="text" class="form-control m-3" id="to" placeholder="Spender address">
                    <span id="to-error" class="d-none"></span>
                    <input type="text" class="form-control m-3" id="amount" placeholder="Amount">
                    <span id="amount-error" class="d-none"></span>
                    <button type="submit" class="btn btn-primary m-3">Approve</button>
                </fieldset>`);
            formEvent.off("submit").on("submit", handleApprove);
        } else if (action === 'transferFrom') {
            formEvent.html(`
                <fieldset class="d-flex flex-column flex-grow-1 justify-content-center align-items-center">
                    <legend class="m-3 ">Make a Transfer from an address</legend>
                    <input type="text" class="form-control m-3" id="from" placeholder="From">
                    <span id="from-error" class="d-none"></span>
                    <input type="text" class="form-control m-3" id="to" placeholder="To">
                    <span id="to-error" class="d-none"></span>
                    <input type="text" class="form-control m-3" id="amount" placeholder="Amount">
                    <span id="amount-error" class="d-none"></span>
                    <button type="submit" class="btn btn-primary m-3">TransferFrom</button>
                </fieldset>`);
                formEvent.off("submit").on("submit", handleTransferFrom);
        } else {
            console.log(`setForm is clearing form content`);
            formEvent.html('');
        }
    }

    function displayTransferForm(event) {
        console.log("TransferDisplay");
        disconnectDisplay.addClass("d-none");
        setForm('transfer');
        formDisplay.removeClass('d-none');
    }

    function displayApproveForm(event) {
        console.log("ApproveDisplay");
        disconnectDisplay.addClass("d-none");
        setForm('approve');
        formDisplay.removeClass('d-none');
    }
    
    function displayFormTransferFrom(event) {
        console.log("TransferFromDisplay");
        disconnectDisplay.addClass("d-none");
        setForm('transferFrom');
        formDisplay.removeClass('d-none');
    }

    function resetWeb3Display() {
        console.log("Web3Display");
        formDisplay.addClass('d-none');
        disconnectDisplay.removeClass("d-none");
        setForm('clear');
        txPending = false;
    }

    function showToast(message, type = "danger") {
        const toastElement = $("#toast");
        const toastBody = $("#toast-body");

        toastBody.text(message)

        toastElement.attr("class", `toast m-5 bg-${type} bg-opacity-75`);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }

    async function handleTransfer(event) {
        console.log('handleTransfer');
        event.preventDefault();
        if (txPending) return;
        const to = $("#to");
        const toValue = to.val().trim();
        const amountValue = $("#amount").val().trim();
        
        if (!await handleFormError('transfer')) return;
        txPending = true;

        try {
            const contract = await getContract();
            const tx = await contract.transfer(toValue, ethers.utils.parseUnits(amountValue, 3));
            await tx.wait();
            showToast('Transfer done !', 'success');
        } catch (error) {
            showToast(`Transaction error : ${error.message}`, 'danger');
        }
        resetWeb3Display();
    }

    async function handleApprove(event) {
        console.log("ApproveEvent");
        event.preventDefault();
        if (txPending) return;
        const spender = $("#to").val();
        const amountValue = $("#amount").val().trim();

        if (!await handleFormError('approve')) return;
        txPending = true;

        try {
            const contract = await getContract();
            const tx = await contract.approve(spender, ethers.utils.parseUnits(amountValue , 3));
            await tx.wait();
            showToast('Approve done !', 'success');
        } catch (error) {
            showToast(`Transaction error : ${error.message}`, 'danger');
        }
        resetWeb3Display();
    }


    async function handleTransferFrom(event) {
        console.log("TransferFromEvent");
        event.preventDefault();
        if (txPending) return;
        const from = $("#from").val().trim();
        const to = $("#to").val().trim();
        const amountValue = $("#amount").val().trim();

        if (!await handleFormError('transferFrom')) return;
        txPending = true;

        try {
            const contract = await getContract();
            const tx = await contract.transferFrom(from, to, ethers.utils.parseUnits(amountValue, 3));
            await tx.wait();
            showToast('TransferFrom done !', 'success');
        } catch (error) {
            if (error.code === 4001) {
                showToast('Transaction error : User rejected the request.', 'warning');
            }
            else {
                showToast(`Transaction error : check carefully the transaction (approvals, balance ..)`, 'danger')
            }
        }
        resetWeb3Display();
    }

    async function handleFormError(form) {
        const to = $("#to");
        const amount = $("#amount");
        const toError = $("#to-error");
        const amountError = $("#amount-error");
        let balance = localStorage.getItem('balance');
        let ret = true;

        toError.addClass("d-none");
        to.removeClass("is-invalid");
        amount.removeClass("is-invalid");
        amountError.addClass("d-none");

        if (form === "transferFrom") {
            const from = $("#from");
            const fromError = $("#from-error");
            from.removeClass("is-invalid");
            fromError.addClass("d-none");
            const fromValue = from.val().trim();
            
            if (!ethers.utils.isAddress(fromValue)){
                from.addClass("is-invalid");
                fromError.text('Invalid address').removeClass("d-none").addClass("text-danger");
                ret = false;
            } else {
                const contract = getReadOnlyContract();
                const balanceExt = await contract.balanceOf(fromValue);
                balance = ethers.utils.formatUnits(balanceExt, 3);
            }
        }

        const toValue = to.val().trim();
        if (!ethers.utils.isAddress(toValue)) {
            to.addClass("is-invalid");
            toError.text('Invalid address').removeClass("d-none").addClass("text-danger");
            ret = false;
        }

        try {
                const balanceBN = ethers.utils.parseUnits(balance, 3);
                const amountValue = ethers.utils.parseUnits(amount.val().trim(), 3);
                if (amountValue.lt(0)) {
                    amount.addClass("is-invalid");
                    amountError.text('Amount must be postive').removeClass("d-none").addClass("text-danger");
                    ret = false;
                }
                else if (amountValue.gt(balanceBN)) {
                    amount.addClass("is-invalid");
                    amountError.text('Insufficient funds').removeClass("d-none").addClass("text-danger");
                    ret = false;
                }
            } catch (error) {
            amount.addClass("is-invalid");
            amountError.text("Amount error : check amount, decimals").removeClass("d-none").addClass("text-danger");
            return false;
        }
        return ret;
    }

    function initEventListeners() {
        window.ethereum.on("accountsChanged", async (accounts) => {
            console.log('Rabby account changed : ', accounts);
            if (accounts.length === 0) {
                handleDisconnectWallet();
            } else {
                localStorage.setItem('userAddress', accounts[0]);
                await updateBalance();
            }
        });
        // Other option : Listenning 'block' event from provider and check balance every block
        const contract = getReadOnlyContract();
        contract.on('Transfer', async (from, to, value, event) => {
            console.log("Transfer event detected !");
            const user = localStorage.getItem('userAddress');
            if (from.toLowerCase() === user || to.toLowerCase() === user) {
                await updateBalance();
            }
        });
        walletConnection.on('click', handleConnectWallet);
        walletDisconnection.on('click', handleDisconnectWallet);
        transfer.on('click', displayTransferForm);
        approve.on('click', displayApproveForm);
        transferFrom.on('click', displayFormTransferFrom);
    }
    initEventListeners();
});
