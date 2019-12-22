pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/WikiChain.sol";

contract TestWikiChain{

	WikiChain private wikichain;
	address payable articleAddressPayable;
	address articleAddress;

	WikiChainUtilities.Article private artData1 = WikiChainUtilities.Article({pageid:123,revid:258,title:"Test Site",lastmodified:"2019-12-31T23:45:000Z",url:"http://example.com",description:"Description"});
	WikiChainUtilities.Article private artData2 = WikiChainUtilities.Article({pageid:9867243,revid:154865903,title:"Ringo Game",lastmodified:"2018-06-31T13:45:000Z",url:"http://ringo-game.com",description:"Description"});
	
	function beforeAll() public{
		// The address of the adoption contract to be tested
		wikichain = WikiChain(DeployedAddresses.WikiChain());
	}

	// Testing the getRegisterCounter() function
	function testGetRegisterCounterVariable() public {

		uint lastCount = 0;
	  	uint registerCounter = wikichain.getRegisterCounter();
	  	Assert.equal(registerCounter, lastCount, "must be equal");
	}

	// Testing the generateContracts4Articles() function
	function testGenerateContracts4ArticlesTuple() public {

		WikiChainUtilities.Article [] memory datas = new WikiChainUtilities.Article [](2) ;
		datas[0] = artData1;
		datas[1] = artData2;

	  	uint returnCounter = wikichain.generateContracts4Articles(datas);
	  	Assert.equal(returnCounter, datas.length , "must be equal");
	}

	// Testing the testRequest() function
	function testRequestReceivedFromUserInterface() public {

	  	WikiChainUtilities.ArticleOutput [] memory returnOutputs = wikichain.request(artData1.url);
	  	articleAddress = returnOutputs[0].myaddress;
	  	articleAddressPayable = address(uint160(articleAddress));
	  	Assert.equal(returnOutputs.length, 1 , "must be equal");
	}

	// Testing the callContract() function
	function testCallContractKnowingTheAddress() public {

	  	WikiChainUtilities.ArticleOutput memory returnOutput = wikichain.callContract(articleAddressPayable);

	  	address contractAddress = returnOutput.myaddress;
	  	Assert.notEqual(contractAddress, address(0) , "must be equal");
	}

	// Testing the new WikiChain() function
	function testInstanceWithNewWikiChain() public {

	  	WikiChain wiki = new WikiChain();

	  	uint expectedBalance = 0;

	  	Assert.equal(address(wiki).balance, expectedBalance, "The new WikiChain should have 0 wei initially");
	}

	// Testing the testLookup() function. MODIFIER is INTERNAL. Can't be tested in this way. 
	/*function testLookup() public {

	  	address returnAddress = wikichain.lookup(artData1.url, artData1.pageid, artData1.revid );
	  	Assert.noEqual(returnAddress, address(0) , "must not be equal");
	} */

	// Testing the callContracts() function MODIFIER is INTERNAL. Can't be tested in this way. 
	/*function testCallContracts() public {

		WikiChainUtilities.Address2Id [] memory register = new WikiChainUtilities.Address2Id [](2) ;
		
		register[0] = WikiChainUtilities.Address2Id(lookup(artData1.url), );
		register[1] = artData2;

	  	WikiChainUtilities.ArticleOutput [] memory returnOutputs = wikichain.callContracts(datas);
	  	Assert.noEqual(returnAddress, address(0) , "must not be equal");
	}   */

	

}