pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./WikiChainUtilities.sol";

/**
 * 
 * Standard Template for the articles on the blockchain
 * 
**/
contract WikiChainArticle {

	uint public pageid;
	uint public revid;
	string public url;
	string public title;
	string public hash_description; // HTML Texts are too big for savings on ethereum. Save it on IPFS or Swarm
	string public lastmodified;
	address register;

	event newDepositForArticle( address sender, uint value, uint timestamp);
	event dataSet(address contractaddress, string url, uint pageid, uint revid);
	event callContract(address contractaddress , string url, uint pageid, uint revid, string title, string timestamp, string hash_description);

	constructor () public payable {
		 if (msg.value > 0){
		 	emit newDepositForArticle( msg.sender, msg.value, block.timestamp);
		 }
	}

	// If the contract received some ether, it will handel it
	function () external payable {
	    require(msg.data.length == 0);
	    emit newDepositForArticle( msg.sender, msg.value, block.timestamp);
	}
	
	function setDatas (address reg, WikiChainUtilities.Article memory data) public {
        register = reg;
	    pageid = data.pageid;
	    revid = data.revid;
	    title = data.title;
	    lastmodified = data.lastmodified;
	    url = data.url;
	    hash_description = data.description;
	   	    
	    emit dataSet( address(this), url, pageid, revid);
	}

	function callDatas () public {
		emit callContract(address(this), url, pageid, revid, title, lastmodified, hash_description);
	}
	
	
	function toString () public view returns (WikiChainUtilities.ArticleOutput memory) {
	    return WikiChainUtilities.ArticleOutput(address(this), pageid, revid, url, title, hash_description, lastmodified);
	}

}