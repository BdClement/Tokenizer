// import { ethers } from "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js";//CDN Bloqué
import { ethers } from "https://unpkg.com/ethers@5.7.2/dist/ethers.esm.min.js";//CDN non bloqué

console.log('ethers.js loaded');


const contractAddress = "0x21eA36E6120eEcfd62569B2a7e0201350473Ea55";
let abiTokenContract = {};



$(document).ready(async function() {
    console.log("Script WALLET");

    async function init() {
        try {
            const response = await fetch("../static/js/abiToken.json");
            abiTokenContract = await response.json();

            const provider = new ethers.providers.Web3Provider(window.ethereum);

            const network = await provider.getNetwork();
            console.log(`TEST = ${network.chainId}`);
            if (network.chainId !== 97) {
                alert('You must be connected to Binance Smart Chain Test (ChainId: 97)');
            }
            
            const resultAccounts = await provider.send("eth_requestAccounts", []);

            const contract = new ethers.Contract(contractAddress, abiTokenContract, provider);
            const balanceExt = await contract.balanceOf(resultAccounts[0]);
            console.log(ethers.utils.formatUnits(balanceExt, 3));

        }
        catch (error) {
            console.error("Erreur contrat : ", error);
        }
    }
    await init();

    const connectWallet = $("#connect-wallet");

    async function handleConnectWallet(event){
        event.preventDefault();
        console.log('Appel a handleConnectWallet');
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isRabby) {
            // provider is RPC
            // const provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log(window.ethereum);
            // Connecting to rabby account 
            // const resultAccounts = await provider.send("eth_requestAccounts", []);
            // console.log(resultAccounts);
            // if (resultAccounts.length > 0) {
            //     localStorage.setItem('userAddress', resultAccounts[0])
            // }
            // const contract = new ethers.Contract(contractAddress, abiTokenContract, provider);
            // console.log(contract);
            // console.log(abiTokenContract);
            // const balanceExt = await contract.balanceOf(resultAccounts[0]);

            // console.log(ethers.utils.formatUnits(balanceExt, 3));
            // const balance = await provider.getBalance("0x6F3b026Cbdf32f5FfDe09FA51FE88Eaea8409F44");
            // console.log(ethers.utils.formatEther(balance));
        }
        else {
            console.log('Rabby needs to be installed.');
            // alert ??
        }
    }

    function initEventListeners() {
        connectWallet.on('click', handleConnectWallet);
    }
    initEventListeners();
});
