// const Migrations = artifacts.require("Migrations");
const Tokenizer = artifacts.require("HelloWorld");

module.exports = function(deployer) {
    // deployer.deploy(Migrations);
    deployer.deploy(Tokenizer);
};