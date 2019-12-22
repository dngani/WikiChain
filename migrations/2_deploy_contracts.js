const wc_utilities = artifacts.require("WikiChainUtilities");
const wc_article = artifacts.require("WikiChainArticle");
const wikichain = artifacts.require("WikiChain");

module.exports = function(deployer) {

	deployer.then( async function (){

		await deployer.deploy(wc_utilities);	// {overwrite: true} only in dev mode
		await deployer.link(wc_utilities,wc_article);

		var utils = await wc_utilities.deployed();

		await deployer.deploy(wc_article); // {overwrite: true} only in dev mode

		await deployer.link(wc_utilities,wikichain);
		await deployer.link(wc_article,wikichain);
		await deployer.deploy(wikichain); // {overwrite: true} only in dev mode
	})
};
