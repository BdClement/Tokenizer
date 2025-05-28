// import { ethers } from "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js";//CDN Bloqué
import { ethers } from "https://unpkg.com/ethers@5.7.2/dist/ethers.esm.min.js";//CDN non bloqué
import { getAbi, getProvider, getContract, getReadOnlyContract } from "./init-wallet.js";

// Affichage du solde 
// Update balance - Function
// Ecoute de l'event changement de compte via window.account
// Gestion des entrées utilisateurs erreurs ??

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

    // const web3Features = $("#web3-features");
    const formDisplay = $("#form-display");
    const formEvent = $("#form-event");
    // formEvent.html(`<button type="submit">Transfer</button>`);
    // console.log(`TEST form = ${formEvent}`);

    const transfer = $("#transfer");
    const approve = $("#approve");
    const transferFrom = $("#transfer-from");

    // console.log(`TEST chargement script ${localStorage.getItem('userAddress')}`);
    // localStorage.removeItem('userAddress');// A Supprimer
    if (localStorage.getItem('userAddress') !== null) {
        // console.log('rentre dna le if null');
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
        // abiTokenContract = getAbi();
        const provider = getProvider();
        const network = await provider.getNetwork();
        // console.log(`TEST = ${network.chainId}`);
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
        // const contract = getContract();
        // const balanceExt = await contract.balanceOf(resultAccounts[0]);
        // const humanBalance = ethers.utils.formatUnits(rawBalance, 3);
        // localStorage.setItem('balance', ethers.utils.formatUnits(balanceExt, 3));
        // balanceDisplay.html(`<p class="lead mt-auto">$EXT balance : ${localStorage.getItem('balance')} EXT</p>`);
        // console.log(ethers.utils.formatUnits(balanceExt, 3));
        console.log(localStorage.getItem('balance'));
    }
    
    async function handleConnectWallet(event) {
        console.log('Appel a handleConnectWallet');
        event.preventDefault();

        // Protection if userAddress is set dans LocalStorage
        if (localStorage.getItem('userAddress') !== null) {
            alert('A wallet is already connected. Disconnect wallet to connect an other one.');
        } 
        else if (typeof window.ethereum !== 'undefined' && window.ethereum.isRabby) {
            try {
                await connectWallet();
                connectDisplay.addClass("d-none");
                disconnectDisplay.removeClass("d-none");
                // web3Features.removeClass("d-none");
            } catch (error) {
                alert(`Connect wallet error : ${error.message}`);
            }
        }
        else {
            alert('Rabby needs to be installed.');
        }
    }

    function handleDisconnectWallet(event) {
        event.preventDefault();
        connectDisplay.removeClass("d-none");
        disconnectDisplay.addClass("d-none");
        // web3Features.addClass("d-none");

        localStorage.removeItem('userAddress');
        localStorage.removeItem('balance');
        // console.log(`TEST handleDisconnect ${localStorage.getItem('userAddress')}`);
    }

    function setForm(action) {
        if (action === 'transfer') {
            formEvent.html(`
                <fieldset class="d-flex flex-column flex-grow-1 justify-content-center align-items-center">
                    <legend class="m-3 ">Make a Transfer</legend>
                        <input type="text" class="form-control m-3" id="to" placeholder="To">
                        <input type="text" class="form-control m-3" id="amount" placeholder="Amount">
                        <button type="submit" class="btn btn-primary m-3">Transfer</button>
                </fieldset>`);
            formEvent.on("submit", handleTransfer);
        } else if (action === 'approve') {
            formEvent.html(`
                <fieldset class="d-flex flex-column flex-grow-1 justify-content-center align-items-center">
                    <legend class="m-3 ">Make an Approval</legend>
                    <input type="text" class="form-control m-3" id="spender" placeholder="Spender address">
                    <input type="text" class="form-control m-3" id="amount" placeholder="Amount">
                    <button type="submit" class="btn btn-primary m-3">Approve</button>
                </fieldset>`);
            formEvent.on("submit", handleApprove);
        } else if (action === 'transferFrom') {
            formEvent.html(`
                <fieldset class="d-flex flex-column flex-grow-1 justify-content-center align-items-center">
                    <legend class="m-3 ">Make a Transfer from an address</legend>
                    <input type="text" class="form-control m-3" id="from" placeholder="From">
                    <input type="text" class="form-control m-3" id="to" placeholder="To">
                    <input type="text" class="form-control m-3" id="amount" placeholder="Amount">
                    <button type="submit" class="btn btn-primary m-3">TransferFrom</button>
                </fieldset>`);
                formEvent.on("submit", handleTransferFrom);
        } else {
            console.log('Error : wrong action');
        }
    }

    function displayTransferForm(event) {
        console.log("TransferDisplay");
        // Cacher Disconnect Display
        disconnectDisplay.addClass("d-none");
        //Afficher form en attribuant la valeur de form en fonction de l'event
        setForm('transfer');
        formDisplay.removeClass('d-none');
    }

    async function handleTransfer(event) {
        event.preventDefault();
        const to = $("#to").val();
        const amount = ethers.utils.parseUnits($("#amount").val(), 3);
        console.log(`L'adresse de destination est ${to} et le montant est ${amount}`);
        
        // const contract = getContract();
        // const tx = await contract.transfer(to, amount);
        // await tx.wait();
        // alert("Transfer done!");
        //Gestion d'erreur ??
        //Changement d'affichage Réafficher diconnect et caché + Clear formEvent
        // Update balance (in a function)
        // await updateBalance();
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
        const spender = $("#spender").val();
        const amount = ethers.utils.parseUnits($("#amount").val(), 3);
        console.log(`L'adresse du spender est ${spender} et le montant est ${amount}`);

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
        const from = $("#from").val();
        const to = $("#to").val();
        const amount = ethers.utils.parseUnits($("#amount").val(), 3);
        console.log(`Le transfer est depuis ${from} à ${to} et le montant est ${amount}`);

        // const contract = getContract();
        // const tx = await contract.transferFrom(from, to, amount);
        // await tx.wait();
        // alert('transferFrom done!');
        //Gestion d'erreur ??  
        //Changement d'affichage Réafficher diconnect et caché + Clear formEvent
        // Update balance (in a function)
        // await updateBalance();
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
        walletConnection.on('click', handleConnectWallet);
        walletDisconnection.on('click', handleDisconnectWallet);
        transfer.on('click', displayTransferForm);
        approve.on('click', displayApproveForm);
        transferFrom.on('click', displayFormTransferFrom);
    }
    initEventListeners();
});
