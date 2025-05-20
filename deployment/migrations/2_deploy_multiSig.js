const multiSig = artifacts.require("MultiSigWallet");

module.exports = function(deployer) {
  const teamAddress = "0x42B95c6e32d50f1FB61Cac1F4d35a2408c883426";
  const communityAddress = "0x984835c0a2659A1DdeD9C3855Ea8E01f319Fb7DD";
  const ownerAddress = "0x6F3b026Cbdf32f5FfDe09FA51FE88Eaea8409F44"

  const addresses = [ownerAddress, teamAddress, communityAddress];
  deployer.deploy(multiSig, 2, addresses);
};