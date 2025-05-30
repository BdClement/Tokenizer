// import { ethers } from "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js";//CDN Bloqué
import { ethers } from "https://unpkg.com/ethers@5.7.2/dist/ethers.esm.min.js";//CDN non bloqué
import { getAbi, getProvider, getContract, getReadOnlyContract } from "./init-wallet.js";

// Gestion des entrées utilisateurs erreurs ?? => redécouper plus proprement ?
// faire et tester transaction
// Ameliorer l'ux (alert..)

console.log('ethers.js loaded');


const contractAddress = "0x21eA36E6120eEcfd62569B2a7e0201350473Ea55";
const BscTesnetChainId = 97;
let abiTokenContract = {};

$(document).ready(async function() {
    console.log("Script WALLET");
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
        if (user !== null) {
            const contract = getReadOnlyContract();
            const balanceExt = await contract.balanceOf(user);
            const amount = ethers.utils.formatUnits(balanceExt, 3);
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
        console.log(localStorage.getItem('balance'));
    }
    
    async function handleConnectWallet(event) {
        console.log('Appel a handleConnectWallet');
        event.preventDefault();

        if (localStorage.getItem('userAddress') !== null) {
            alert('A wallet is already connected. Disconnect wallet to connect an other one.');
        } 
        else if (typeof window.ethereum !== 'undefined' && window.ethereum.isRabby) {
            try {
                await connectWallet();
                connectDisplay.addClass("d-none");
                disconnectDisplay.removeClass("d-none");
            } catch (error) {
                alert(`Connect wallet error : ${error.message}`);
            }
        }
        else {
            alert('Rabby needs to be installed.');
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
            formEvent.on("submit", handleTransfer);
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
            formEvent.on("submit", handleApprove);
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
                formEvent.on("submit", handleTransferFrom);
        } else {
            console.log('Error : wrong action');
        }
    }

    function displayTransferForm(event) {
        console.log("TransferDisplay");
        disconnectDisplay.addClass("d-none");
        setForm('transfer');
        formDisplay.removeClass('d-none');
    }

    async function handleTransfer(event) {
        event.preventDefault();
        // Check before TransactionIc
        // const to = $("#to");
        // const amount = $("#amount");
        // const toError = $("#to-error");
        // const amountError = $("#amount-error");
        // toError.addClass("d-none");
        // to.removeClass("is-invalid");
        // amount.removeClass("is-invalid");
        // amountError.addClass("d-none");

        // const toValue = to.val().trim();
        // const amountValue = ethers.utils.parseUnits(amount.val().trim(), 3);
        // try {
        //     if (!isValidAddress(toValue)) {
        //         // throw Error('Invalid address');
        //         to.addClass("is-invalid");
        //         toError.text('Invalid address').removeClass("d-none").addClass("text-danger");
        //         return ;
        //     }
        //     console.log(`test amont value = ${amount.val().trim()} et balance = ${Number(localStorage.getItem('balance'))}`);
        //     const amountValue = ethers.utils.parseUnits(amount.val().trim(), 3);
        //     console.log(amountValue);
        //     if (amountValue.lt(0)) {
        //         // throw Error('Amount must be postive');
        //         // console.log('rentre dans le if');
        //         amount.addClass("is-invalid");
        //         amountError.text('Amount must be postive').removeClass("d-none").addClass("text-danger");
        //         return;
        //     }
        //     else if (!amountValue.lte(Number(localStorage.getItem('balance')))) {
        //         amount.addClass("is-invalid");
        //         amountError.text('Insufficient funds').removeClass("d-none").addClass("text-danger");
        //         return;
        //     }
        // } catch (error) {
        //     console.log('Error : ', error.message);
        //     amount.addClass("is-invalid");
        //     amountError.text("Amount error : check amount, decimals").removeClass("d-none").addClass("text-danger");
        // }
        await handleFormError('transfer');
        // console.log(`L'adresse de destination est ${toValue} et le montant est ${amount}`);
        
        // const contract = getContract();
        // const tx = await contract.transfer(to, amount);
        // await tx.wait();
        // alert("Transfer done!");
        //Gestion d'erreur ??
        //Changement d'affichage Réafficher diconnect et caché + Clear formEvent
    }

    function isValidAddress(address) {
        return ethers.utils.isAddress(address);
        // What is showError
    }

    async function handleFormError(form) {
        //Logique globale
        const to = $("#to");
        const amount = $("#amount");
        const toError = $("#to-error");
        const amountError = $("#amount-error");
        let balance = localStorage.getItem('balance');

        toError.addClass("d-none");
        to.removeClass("is-invalid");
        amount.removeClass("is-invalid");
        amountError.addClass("d-none");

        //Logique TransferFrom
        if (form === "transferFrom") {
            const from = $("#from");
            const fromError = $("#from-error");
            from.removeClass("is-invalid");
            fromError.addClass("d-none");
            const fromValue = from.val().trim();
            console.log(`transferFrom from = ${fromValue}`);
            
            if (!ethers.utils.isAddress(fromValue)){
                from.addClass("is-invalid");
                fromError.text('Invalid address').removeClass("d-none").addClass("text-danger");
            } else {
                const contract = getReadOnlyContract();
                const balanceExt = await contract.balanceOf(fromValue);
                balance = ethers.utils.formatUnits(balanceExt, 3);
                console.log(`balance == ${balance}`);
            }
        }
        const toValue = to.val().trim();
        if (!ethers.utils.isAddress(toValue)) {
            to.addClass("is-invalid");
            toError.text('Invalid address').removeClass("d-none").addClass("text-danger");
        }
        try {
                // console.log(`balance = ${balance} // amount = ${amount.val().trim()}`);
                const balanceBN = ethers.utils.parseUnits(balance, 3);
                const amountValue = ethers.utils.parseUnits(amount.val().trim(), 3);
                if (amountValue.lt(0)) {
                    amount.addClass("is-invalid");
                    amountError.text('Amount must be postive').removeClass("d-none").addClass("text-danger");
                }
                else if (amountValue.gt(balanceBN)) {
                    amount.addClass("is-invalid");
                    amountError.text('Insufficient funds').removeClass("d-none").addClass("text-danger");
                }
            } catch (error) {
            // console.log(`to = ${toValue}, amount = ${amount.val()}`);
            amount.addClass("is-invalid");
            amountError.text("Amount error : check amount, decimals").removeClass("d-none").addClass("text-danger");
        }
    }

    function displayApproveForm(event) {
        console.log("ApproveDisplay");
        // Cacher Disconnect Display
        disconnectDisplay.addClass("d-none");
        //Afficher form en attribuant la valeur de form en fonction de l'event
        setForm('approve');
        formDisplay.removeClass('d-none');
    }

    async function handleApprove(event) {
        console.log("ApproveEvent");
        event.preventDefault();
        // const spender = $("#to").val();
        // const amount = ethers.utils.parseUnits($("#amount").val(), 3);
        // console.log(`L'adresse du spender est ${spender} et le montant est ${amount}`);
        await handleFormError('approve');

        // const contract = getContract();
        // const tx = await contract.approve(spender, amount);
        // await tx.wait();
        // alert('Approve done!');
        //Gestion d'erreur ??  
        //Changement d'affichage Réafficher diconnect et caché + Clear formEvent
    }

    function displayFormTransferFrom(event) {
        console.log("TransferFromDisplay");
        // Cacher Disconnect Display
        disconnectDisplay.addClass("d-none");
        //Afficher form en attribuant la valeur de form en fonction de l'event
        setForm('transferFrom');
        formDisplay.removeClass('d-none');
    }

    async function handleTransferFrom(event) {
        console.log("TransferFromEvent");
        event.preventDefault();
        // const from = $("#from").val();
        // const to = $("#to").val();
        // const amount = ethers.utils.parseUnits($("#amount").val(), 3);
        // console.log(`Le transfer est depuis ${from} à ${to} et le montant est ${amount}`);
        await handleFormError('transferFrom');

        // const contract = getContract();
        // const tx = await contract.transferFrom(from, to, amount);
        // await tx.wait();
        // alert('transferFrom done!');
        //Gestion d'erreur ??  
        //Changement d'affichage Réafficher diconnect et caché + Clear formEvent
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
