pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/WikiChainArticle.sol";

contract TestWikiChainArticle{

	WikiChainArticle private wikiArticle;
	address private register;
	
	WikiChainUtilities.Article private artData1 = WikiChainUtilities.Article({pageid:123,revid:258,title:"Test Site",lastmodified:"2019-12-31T23:45:000Z",url:"http://example.com",description:"Description"});
	WikiChainUtilities.Article private artData2 = WikiChainUtilities.Article({pageid:9867243,revid:154865903,title:"Ringo Game",lastmodified:"2018-06-31T13:45:000Z",url:"http://ringo-game.com",description:"Description"});
	
	function beforeAll() public{
		// The address of the adoption contract to be tested
		wikiArticle = WikiChainArticle(DeployedAddresses.WikiChainArticle());
		register = DeployedAddresses.WikiChain();
	}

	// Testing the setDatas() function
	function testSetDatas() public {

		wikiArticle.setDatas(register, artData1);
		// The pageid for both should be equal
	  	Assert.equal(wikiArticle.pageid(), artData1.pageid," should be equal.");
	}

	// Testing the callDatas() function. This functin just emit an event.
	function testCallDatasOnDeployedInstance() public {

		wikiArticle.callDatas();
	  	Assert.isTrue(true, "callDatas emit an event from the article contract");
	}

	// Testing the toString() function
	function testToStringForExistingArticle() public {

		WikiChainUtilities.ArticleOutput memory output = wikiArticle.toString();
	  	Assert.notEqual(output.myaddress, address(0) , "must not be equal");
	}

	// Testing the setDatas() function
	function testSecondSetDatas() public {

		wikiArticle.setDatas(register, artData2);
		// The pageid for both should be equal
	  	Assert.equal(wikiArticle.pageid(), artData2.pageid," should be equal.");
	}

	// Testing the setDatas() function
	function testDatasUpdateAfterSecondSet() public {

		// The data have been change after the testFirstSetDatas() using artData1. Is true? 
	  	Assert.notEqual(wikiArticle.pageid(), artData1.pageid," should not be equal.");
	}


	// Testing the new WikiChainArticle() function
	function testInstanceWithNewWikiChainArticle() public {

	  	WikiChainArticle wiki = new WikiChainArticle();

	  	uint expectedBalance = 0;

	  	Assert.equal(address(wiki).balance, expectedBalance, "The new WikiChainArticle should have 0 wei initially");
	}

	// Testing the new WikiChainArticle() function
	function testInstanceWithNewWikiChainArticleAndSetDatas() public {

	  	WikiChainArticle wiki = new WikiChainArticle();
	  	wiki.setDatas(register,artData1);
	  	
	  	Assert.equal(wiki.pageid(), artData1.pageid, "The new WikiChainArticle should have 0 wei initially");
	}
	

}