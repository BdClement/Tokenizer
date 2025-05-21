// Truffle charge le script comme un module donc il faut charger un module
// npm install installe les dependances de package json et regenere les nodes_modules

const ownerAddress = '0x6F3b026Cbdf32f5FfDe09FA51FE88Eaea8409F44';
const teamAddress = '0x42B95c6e32d50f1FB61Cac1F4d35a2408c883426';
const airdropAddress = '0x403B6D37503391cdbdf66c9050268a0288C16310';
const communityAddress = '0x984835c0a2659A1DdeD9C3855Ea8E01f319Fb7DD';
const investorsAddress = '0xA20216D4De8B681b3864be45495E5cba2EF183ad';


// Truffle utlise les comptes defini dans le HDWalletProvider
// Ayant specifie qu'un compte, il faudrait soit modifier la config soit signer manuellement des transaciton avec web3

module.exports = async function (callback) {
    const Token42 = artifacts.require("Token42");
    const multiSig = artifacts.require("MultiSigWallet");
    
    const Extend42 = await Token42.at("0x21eA36E6120eEcfd62569B2a7e0201350473Ea55");
    const multiSigEXT = await multiSig.at("0xB4C3b9c2F27C1806EfAc3888658716738d6Ef5B4");
    console.log("\x1b[33m%s\x1b[0m", "Info");
    const decimals = await Extend42.decimals();
    console.log(`Les montants utilises dans ce script ne prennent pas en compte les decimals qui sont egales a ${Number(decimals)}\n`);

    console.log("\x1b[33m%s\x1b[0m", "Initialement :");
    let supply = await Extend42.totalSupply();
    let ownerBalance = await Extend42.balanceOf(ownerAddress);
    let teamBalance = await Extend42.balanceOf(teamAddress);
    let airdropBalance = await Extend42.balanceOf(airdropAddress);
    let communityBalance = await Extend42.balanceOf(communityAddress);
    let investorsBalance = await Extend42.balanceOf(investorsAddress);
    console.log(`
    La totalSupply est de :             ${Number(supply)}
    La balance du owner est :           ${ownerBalance}
    La balance de la team est :         ${teamBalance}
    La balance du aridrop est :         ${airdropBalance}
    La balance de la community est :    ${communityBalance}
    La balance des investisseurs est :  ${investorsBalance}\n`);

    console.log("\x1b[33m%s\x1b[0m", "Transfer de token :");
    await Extend42.transfer(teamAddress, 5000);
    console.log("\x1b[32m%s\x1b[0m", "✅ Transaction validée !");
    ownerBalance = await Extend42.balanceOf(ownerAddress);
    teamBalance = await Extend42.balanceOf(teamAddress);
    console.log(`
    Apres un transfer de 5000 EXT (5 EXT en realite) du owner vers la team :
    La balance du owner est :   ${ownerBalance}
    La balance de la team est : ${teamBalance}\n`);
// REFAIRE UN TRANSFER DANS L'AUTRE SENS
    await Extend42.transfer(ownerAddress, 5000, {from: teamAddress});
    


    console.log("\x1b[33m%s\x1b[0m", "Owner approve que la team puisse depense 1000 EXT depuis son wallet :");
    await Extend42.approve(teamAddress, 1000);
    console.log("\x1b[32m%s\x1b[0m", "✅ Transaction validée !");

    console.log("\x1b[33m%s\x1b[0m", "La team transfer 1000 EXT du wallet du owner vers le sien");
    await Extend42.transferFrom(ownerAddress, teamAddress, 1000, {from: teamAddress});
    console.log("\x1b[32m%s\x1b[0m", "✅ Transaction validée !");
    ownerBalance = await Extend42.balanceOf(ownerAddress);
    teamBalance = await Extend42.balanceOf(teamAddress);
    teamBalance = await Extend42.balanceOf(teamAddress);
    console.log(`
    La balance du owner est :   ${ownerBalance}
    La balance de la team est : ${teamBalance}\n`);
// // REFAIRE UN TRANSFER DANS L'AUTRE SENS
    await Extend42.transfer(ownerAddress, 1000, {from: teamAddress});

    console.log("\x1b[33m%s\x1b[0m", "La team burn 1000 token");
    await Extend42.burn(1000, {from: teamAddress});
    supply = await Extend42.totalSupply();
    teamBalance = await Extend42.balanceOf(teamAddress);
    console.log(`
    La totalSupply est :        ${Number(supply)}
    La balance de la team est : ${teamBalance}\n`);


    // MultiSig mint
    // Oblige de creer une nouvelle instance de web3 ici pour avoir acces a encodeABI
    console.log("\x1b[33m%s\x1b[0m", "Le owner soumet une transaction pour mint 1000 EXT vers le wallet de la team");
    const contractToken = new web3.eth.Contract(Token42.abi, "0x21eA36E6120eEcfd62569B2a7e0201350473Ea55");
    await Extend42.setMultiSig("0xB4C3b9c2F27C1806EfAc3888658716738d6Ef5B4");// Important !!

    const data = contractToken.methods.mint(teamAddress, 1000).encodeABI();
    const resultSubmit = await multiSigEXT.submitTx(Extend42.address, 0, data);
    console.log("\x1b[32m%s\x1b[0m", "✅ Transaction validée !\n");
    let logs = resultSubmit.logs;
    let txId = logs[0].args[0];//get txId to confirm it

    console.log("\x1b[33m%s\x1b[0m", "La team confirm la transaction soumise par le owner");
    await multiSigEXT.confirmTx(txId, {from: teamAddress});
    console.log("\x1b[32m%s\x1b[0m", "✅ Transaction validée !");
    supply = await Extend42.totalSupply();
    supply = await Extend42.totalSupply();
    ownerBalance = await Extend42.balanceOf(ownerAddress);
    teamBalance = await Extend42.balanceOf(teamAddress);
    airdropBalance = await Extend42.balanceOf(airdropAddress);
    communityBalance = await Extend42.balanceOf(communityAddress);
    investorsBalance = await Extend42.balanceOf(investorsAddress);
    console.log(`
    La totalSupply est :               ${Number(supply)}.
    Le multiSig necessitant 2 signatures sur 3 possibles execute la transaction soumise
    La balance du owner est :          ${ownerBalance}
    La balance de la team est :        ${teamBalance}
    La balance du aridrop est :        ${airdropBalance}
    La balance de la community est :   ${communityBalance}
    La balance des investisseurs est : ${investorsBalance}`);

    callback();
};