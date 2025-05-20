const Extend42 = artifacts.require("token42");

module.exports = function(deployer) {
    deployer.deploy(Extend42, "Extend42", "EXT");
};
