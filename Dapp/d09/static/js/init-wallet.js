import { ethers } from "https://unpkg.com/ethers@5.7.2/dist/ethers.esm.min.js";

// Encapsulation des variables + exposition via export de getters

const contractAddress = "0x21eA36E6120eEcfd62569B2a7e0201350473Ea55";
let abiTokenContract = {};
let provider = null;
let contract = null;

try {
        const response = await fetch("../static/js/abiToken.json");
        abiTokenContract = await response.json();
        provider = new ethers.providers.Web3Provider(window.ethereum);
        //Création d'un contrat en lecture seule
        contract = new ethers.Contract(contractAddress, abiTokenContract, provider);
} catch (error) {
    console.error("Contract init error : ", error);
}

export function getAbi() {
    return abiTokenContract;
}

export function getProvider() {
    return provider;
}

export function getReadOnlyContract() {
    return contract
}

// Need to be called when an account is present in window.ethereum
export function getContract() {
    // Necessite un signer pour utilise le contrat en écriture
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, abiTokenContract, signer);
}
