pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./WikiChainArticle.sol";
import "./WikiChainUtilities.sol";

contract WikiChain{
    
   	event contractAlreadyExist(address contractaddress, string url, uint pageid, uint revid, string message);
	event contractAdded(address contractaddress, string url, uint pageid, uint revid);
	event requestFunction(string url, uint outputsize, WikiChainUtilities.ArticleOutput [] outputs);
	event callContractData(address contractaddress , string url, uint pageid, uint revid, string title, string timestamp, string hash_description);
	event newDeposit( address sender, uint value, uint timestamp);
	
	modifier positiveValue{
	    assert(msg.value > 0);
	    _;
	}
	
	// The register: save in "storage" per default.
    mapping (string => WikiChainUtilities.Address2Id []) private URL2Addresses ;
    uint private counter = 0;
      
    // The constructor
    constructor() public payable { 
    	if(msg.value > 0){
    		emit newDeposit( msg.sender, msg.value, block.timestamp);
    	}
    }

    // If the contract received some ether, it will handel it
	function () external payable positiveValue {
	    require(msg.data.length == 0);
	    emit newDeposit( msg.sender, msg.value, block.timestamp);
	}
	
	function getRegisterCounter() public view returns(uint){
	    return counter;
	}
	   
    /* 
    * As a Factory, this method will generate new instances of the contract WikiChainArticle with the given datas.
    */
    function generateContracts4Articles( WikiChainUtilities.Article [] memory datas) public returns (uint) {
       
       // Minimun one entry should be available. throw a exception if the input array is empty.
        require (datas.length > 0, "The datafeed is empty. Please fill it out!");
        
        WikiChainArticle tmp;
        WikiChainUtilities.Address2Id memory a2p;
        
        uint len = uint(datas.length);
        
	    for(uint i=0; i<len; i++){
	        
	        // We can verified if the data entry is correct ...
	        
	        // We control if a contract with the given url, pageid and revid already exist. And don't create a new contract if it is the case.
	        address oldAddress = lookup(datas[i].url, datas[i].pageid, datas[i].revid);
	        if( oldAddress != address(0)) {
	           emit contractAlreadyExist(oldAddress,datas[i].url, datas[i].pageid, datas[i].revid, "The key-value ( url -> pageid,revid ) already exist.");
	           continue;
	        }
	        
	        //A new contract is generated for every single tuple. We need to sent some Gas for the writing operation in the contract storage.
	        tmp = (new WikiChainArticle).value(30000000)();
	        tmp.setDatas(address(this), datas[i]);
	  	        
	        // Save the new value in the register URL2Addresses
    	    a2p.contractaddress = address(tmp);
    	  	a2p.revid = datas[i].revid;
    	  	a2p.pageid = datas[i].pageid;
    	    
    	   // The new contract for the article must already exist at this point 
    	   //assert(a2p.contractaddress != address(0)); // we have an empty address most of the time. Because the code execution need less  time than the blockchain need to accept and give an address back
    	   
    	   // Even if the url already exist as key, the new infos will be save in the array mapping this url.
    	   URL2Addresses[datas[i].url].push(a2p);
    	   counter++;
    	   emit contractAdded(a2p.contractaddress, datas[i].url, datas[i].pageid, datas[i].revid);
	    }

	    return counter;
    }
    
    /*
     * When the user is searching a url (coming from wikipedia),
        1. the url should not be empty
        2. we first lookup in the register "URL2Addresses", if some contracts exist for the given url.
        3. If there is no entry in the register, we give a empty output back.
        4. Otherwise, we would call the different contracts, collect the saved informations and sent it back as return value.
     *
    */
   	function request( string memory url) public returns (WikiChainUtilities.ArticleOutput [] memory) {
        
        // lookup in the register if a given url already exist before crawling the blockchain for the corresponding contracts
        require (bytes(url).length > 0, "The url is not correct. The variable is empty for this transaction.");
        
        WikiChainUtilities.ArticleOutput [] memory outputs;
        WikiChainUtilities.Address2Id [] memory results;
        
        // Control if there is already a entry for the given url in the register.
        if ( URL2Addresses[url].length != 0 ){
	        results = URL2Addresses[url];
	        
	       // Call the informations out of the contract addresses, we just find.
	       outputs = callContracts(results);
	        
	    } else{
	        // There is not entry for the given url. Make sure the outputs array is empty.
	        delete outputs;
	    }
	    
	    emit requestFunction(url, outputs.length, outputs);

	    return outputs;
      
    }
     
    /*
     * Lookup in the register if the given url, pageid and revid have already saved.
     *
    */
  	function lookup ( string memory url, uint pageid, uint revid) internal view returns (address) {
        // lookp in the register if a given url already exist before crawling the blockchain for the corresponding contracts
        WikiChainUtilities.Address2Id [] memory results;
        
        if ( URL2Addresses[url].length > 0 ){
	        results = URL2Addresses[url];
	        
	        // Search for the given pair <pageid,revid>
	         for (uint i; i< results.length;i++){
	            if( results[i].pageid == pageid && results[i].revid == revid ){
	                return results[i].contractaddress;
	            }
	         }
	    } 
	    return address(0);
    }
    
    /*
     * Call the contracts using the address found in the register.
     *
    */
   	function callContracts(WikiChainUtilities.Address2Id [] memory results) internal view returns (WikiChainUtilities.ArticleOutput [] memory){
	    
	    require (results.length > 0, "There is no contract to check out.");
	    
	    WikiChainUtilities.ArticleOutput [] memory ops =  new WikiChainUtilities.ArticleOutput [](results.length);
	    for (uint i; i< results.length;i++){
	        WikiChainArticle tmp = WikiChainArticle(results[i].contractaddress);
            ops[i] = tmp.toString() ;
        }
	   return ops;
	}

	function callContract(address payable article) public view returns (WikiChainUtilities.ArticleOutput memory){
	    
	    require (article != address(0), "The contract address is not valid. Please give another one.");
	    WikiChainArticle tmp = WikiChainArticle(article);
	    
	    //emit callContractData(article ,tmp.url(), tmp.pageid(), tmp.revid(), tmp.title(), tmp.lastmodified(), tmp.hash_description());
	   
	   return tmp.toString();
	}
	
}