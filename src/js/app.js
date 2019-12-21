/*
* @author: Diane Ngani
* @timestamp: 21.12.2019 20:35
*/

/**
* App is the main object, which represent all functions or request handler for our solution.
* It will be run by the ****CLIENT Browser****. After loading the index.html file, all changes will occures per ajax.
* @connection to the blockchain: App.initWeb3();
* @Creation of an artifact instance of WikiChain: App.initContract(); 
*/
App = {
  web3Provider: null,
  contracts: {}, // Contracts already existing in the blockchain
  articles: {}, // These pages will be parse and prepare for the blockchain
  wikiChainInstance: null,
  accounts: [],

  urlPrefix: "https://de.wikipedia.org/w/api.php", // The used version of wikipedia

  // Articles contens for the contracts
  lastRccontinue: "startrecursion",  // a mark where the query result stop. We can continue fechting up there...
  looping: false,
  revids: [],
  counter: 0,

  init: async function() {
    // Some basic settings in frontend
    App.basicInit();

    // Try to connect to the blockchain
    return await App.initWeb3();
  },

  /*
  * Connect to a blockchain using Metamask or Ganache as fallback
  */

  initWeb3: async function() {

   // Modern dapp browsers...
   if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable(); // Request account access
      } catch (error) {
        console.error("User denied account access"); // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      //App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545'); // Standard dev local blockchain
      App.web3Provider = new Web3.providers.HttpProvider('http://136.199.51.97:8545'); // explicit for external acces
    }
    
    App.web3 = new Web3(App.web3Provider);

    // If App.web3 == 'undefined', it means that no web3 instance was found or created. 
    // Metamask, Ganache or similar tool must be running!!!!!

    return await App.initContract();
  },

  /*
  * Get the contract ABI in <project-folder>/build/contracts and create an instance of truffle-contract, 
  * so that we can use the contract methods
  */
  initContract: async function() {

    try{
      var data = await $.getJSON('WikiChain.json');
    }
    catch(error){
      console.log("\n Some files are missing. Please compile the smart contracts using the following command:\n truffle compile ",error);
    }
    var WikiChainArtifact = data;
    App.contracts.WikiChain = TruffleContract(WikiChainArtifact);

    // Set the provider for our contract
    App.contracts.WikiChain.setProvider(App.web3Provider);

    // Get the WikiChain Contract on the Blockchain
    try{

      // Get the deployed version of the WikiChain. It include the address of the smart contract.
      App.wikiChainInstance = await App.contracts.WikiChain.deployed(); 
    }
    catch(error){
      console.log("\n We cannot access to the deployed version of WikiChain. \nPlease control if all smart contracts are deployed on the used blockchain!!", error);
    }

     // Get the accounts on the Blockchain
    try{
      // Get all available accounts
      App.accounts = await App.web3.eth.getAccounts();

      // use the next account with more than 1 ether
      var balance;
      for (var i = 0; i < App.accounts.length - 1; i++) {

        balance = await App.web3.utils.fromWei( String(await App.web3.eth.getBalance(App.accounts[i])),'ether') ;
       
        if( balance > 1 ){ // If the account has balance over 1ETH, set it as default account.
          App.web3.eth.defaultAccount = App.accounts[i];
          break;
        }
      }

      // If all accounts are under 1 ether, show a warning and use the first account as default.
      if(App.web3.eth.defaultAccount === 'undefined'){
        alert("All accounts have a balance under 1ETH. You need to refill it!!!!");
        App.web3.eth.defaultAccount = App.accounts[0];
      }

    }
    catch(error){
      console.log("\n We cannot access the user accounts on the Blockchain. \nPlease Control your connection to the blockchain with Ganache or Metamask.\n\n And restart it if needed.", error);
      alert("\n We cannot access the USER ACCOUNTS on the Blockchain. \nPlease Control your connection to the blockchain with Ganache or Metamask.\n\n And restart it if needed.");
    }

     return App.refreshInfobar();

  },

  /*
  * Search the given URL in the dedicated register and call the smart cntract if existing
  */

  requestURL: async function(event){
    /* stop form from submitting normally */
    event.preventDefault();

    var URLValue = searchUrlField.value;
    var ethRequest = $('#warnings').empty();

    // control if empty
    if( !URLValue ){
      ethRequest = $('#warnings').empty();
      var message = "<span>Please, enter one valid URL of a wikipedia article.</span>";
      ethRequest.append(message);   
      return;
    }

    // delete empty space at the beginning and the end
    var requestURL = URLValue.trim();
    // 
    try{
     
      // Send the url to the register on the Blockchain
      var result = await App.wikiChainInstance.request(requestURL,{from: App.web3.eth.defaultAccount});

      // present the result
      App.requestOutput(result);
    }
    catch(error){
      alert(error);
      console.log("***"+error+"*** \n\n The request could not be send to the blockchain.\n Please Control your connection to the blockchain with Ganache or Metamask.\n\n And restart it if needed.");
    }
    finally{
      // At the End update the info on the top of the webapp.
      return App.refreshInfobar();
    }


  },

   /*
  * Display the result of the transaction with the blockchain.
  * 
  */
  requestOutput: async function(result){

    // Outputs
 
    var receiptOutput ="<div><span><h4>Receipt from the blockchain</h4></span></div>"
    +"<div><span class='col-6 col-md-2 eth-label'>Status:</span><span>"+result.receipt.status+"</span></div>"
    +"<div><span class='col-6 col-md-2 eth-label'>Block Number:</span><span>"+result.receipt.blockNumber+"</span></div>"
    +"<div><span class='col-6 col-md-2 eth-label'>Gas Used:</span><span>"+result.receipt.gasUsed+"</span></div>"
    +"<div><span class='col-8 col-sm-6 col-md-2 eth-label'>Cumulative Gas Used:</span><span class=''>"+result.receipt.cumulativeGasUsed+"</span></div>"
    +"<div><span class='col-6 col-md-2 eth-label'>Block Hash:</span><span class=''>"+result.receipt.blockHash+"</span></div>"
    +"<div><span class='col-6 col-md-2 eth-label'>Transaction Hash:</span><span class=''>"+result.receipt.transactionHash+"</span></div>"
    +"<div><span class='col-6 col-md-2 eth-label'>From:</span><span class=''>"+result.receipt.from+"</span></div>";

    $('#eth-status-request').empty();
    $('#eth-status-request').append(receiptOutput);  

    console.log(result);

    var outputs = result.receipt.logs[0].args.outputs;
    var printOutput ="";
   
    $('#eth-results').empty();  // HTML-Tag for the display of the result from the blockchain

    // If there is no entry, stop here.
    if ( typeof outputs === 'undefined' || outputs.length == 0){       
        printOutput = "<div>We found <b>no smart contracts</b> for "+result.receipt.logs[0].args.url+"</div>";
        $('#eth-results').append(printOutput); 
        return;
    }

    printOutput = "<div class='my-4 font-weight-bold font-weight-italic'><b>"+outputs.length+" Search Result(s) </b>for "+result.receipt.logs[0].args.url+"</div>";
    // Tuple [] 
    for (var article in outputs){
    // article = ( string myaddress, uint pageid, uintrevid, string url, string title, string hash_description, string lastmodified)
      
      printOutput += "<div class='p-3 mb-2 bg-light border-bottom font-weight-light shadow'>"
      +"<div><span class='col-4 col-md-2 eth-label'>ContractAddress:</span><span><b class='text-break'>"+outputs[article].myaddress+"</b></span></div>"
      +"<div><span class='col-4 col-md-2 eth-label'>Timestamp: </span><span>"+outputs[article].lastmodified+"</span></div>"
      +"<div><span class='col-4 col-md-2 eth-label'>Pageid:</span><span>"+outputs[article].pageid+"</span></div>"
      +"<div><span class='col-4 col-md-2 eth-label'>RevisionID:</span><span>"+outputs[article].revid+"</span></div>"
      +"<div><span class='col-4 col-md-2 eth-label'>Title: </span><span>"+outputs[article].title+"</span></div>"
      +"<div><span class='col-4 col-md-2 eth-label'>Description: </span><span>"+outputs[article].description+"</span></div>"
      +"<div><span class='col-4 col-md-2 eth-label'>URL: </span><span>"+outputs[article].url+"</span></div>"
      +"</div>";
    }

    $('#eth-results').append(printOutput);     
  },

  /*
  * Retrieving new entries / recent Changes on wikipedia
  */

  retrieveAndSaveRecentChanges: async function(){

    // reset global variables
    App.articles = {},
    //App.lastRccontinue = 0,  // a mark where the query result stop. We can continue fechting up there... &rccontinue=20191221065114|283358663
    App.revids = [],
    App.counter = 0;

    /*** First query searching for the recent changes for a given time frame. ****/
    // example: https://de.wikipedia.org/w/api.php?origin=*&action=query&list=recentchanges&rcprop=title|ids|timestamp|flags&rclimit=20&rctype=edit|new&rcstart=2019-11-15T15:00:00.000Z&rcend=2019-11-16T16:01:00.000Z&rcnamespace=0&rcdir=newer&format=json
    
    // Access to the given date interval for the query.
    var qStarttime = new Date (queryStartdate.value+" "+queryStarttime.value+"").toISOString(),
        qEndtime = new Date (queryEnddate.value+" "+queryEndtime.value+"").toISOString();

    // params for the query
    var params = {
        action: "query",
        list: "recentchanges",
        rcprop: "title|ids|timestamp|flags",
        rclimit: ""+queryLimit.value,
        rctype:""+queryChangeTyp.value,
        rcstart:""+qStarttime,
        rcend:""+qEndtime,
        rcnamespace:""+queryNamespace.value,
        rcdir: "newer",
        format: "json"
    };  

    // Set the param rccontinue if this information was available in the precedent query
    if ( App.lastRccontinue !== "norecursion" && App.lastRccontinue !== "startrecursion" && App.looping){
      params.rccontinue = App.lastRccontinue;
    }else if (App.lastRccontinue === "norecursion" && !App.looping){
      $('#retrieved-status-button').text("Recursion stopped");
      $('#retrieved-status-button').attr('started','false');
      console.log(App.lastRccontinue);
      console.log(App.looping);
      return;
    }

    console.log(App.lastRccontinue);
    console.log(App.looping);

    var url = App.urlPrefix + "?origin=*";
    // build the final url with the given parameters.
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
    
    console.log(url);

    // Call the url for real and parse the response.
    try{
      var response = await fetch(url);
      var datas = await response.json();

      if (typeof datas.continue !== "undefined"){ // occurs most of the time when qStarttime == qEndtime
        App.lastRccontinue = datas.continue.rccontinue; // doesn't exit if rcstart and rcsend are the same.
      }else if(typeof datas.continue === "undefined"){
        App.lastRccontinue = "norecursion";
        App.looping = false;
      }
      
      var recentchanges = datas.query.recentchanges;

      // If there is no recentchanges, stop here.
      if ( typeof recentchanges === 'undefined' || recentchanges.length == 0){
        alert("The Wikipedia API has given an empty array as response. \n\nPlease increase the gap between the startdate and enddate!!");
        return;
      }
      
      for (var rc in recentchanges) {
          
          App.revids[App.counter] = recentchanges[rc].revid;
          var id = recentchanges[rc].revid;
          App.articles[id] = {}
          App.articles[id].pageid = recentchanges[rc].pageid;
          App.articles[id].revid = id;
          App.articles[id].title = recentchanges[rc].title;
          App.articles[id].timestamp = recentchanges[rc].timestamp;
          App.counter++;
      }

    }
    catch(error){ console.log(error); }
    finally{}

    return await App.getUrlsAndDesc();

  }, // End of the retrieve and Save.


  /*
  * Using the array App.revids, we will call the urls and the descriptions for the given revisions.
  */
  getUrlsAndDesc: async function (){

    // Each query must have maximum 50 revids. a while loop will be execute depending on the App.revids array length

     var maxLimit = 50, limit = queryLimit.value, startIdx=0, endIdx = limit % maxLimit;
     
      if(startIdx == endIdx){
        endIdx = maxLimit;
      }

      while( startIdx < limit && startIdx <= endIdx ) { 
        var ids = "";

        // concat the ids together, starting from our last start index
        for( var idx = startIdx; idx < endIdx; idx++){
          ids += App.revids[idx]+"|";
        }
        ids = ids.substring(0, ids.length - 1); // last char '|' must be delete 
       
        // URL example https://de.wikipedia.org/w/api.php?action=query&revids=207495|97456942&prop=info|revisions&inprop=url&rvprop=ids|content&rvslots=main&format=json
        var paramsQuery2 = {
            action: "query",
            revids: ids,  //limit 50
            prop: "info|revisions",
            inprop: "url",
            rvprop: "ids|content",
            rvslots: "main",
            format: "json"
        };

        var urlQuery2 = App.urlPrefix + "?origin=*";
        // build the final url with the given parameters.
        Object.keys(paramsQuery2).forEach(function(key){urlQuery2 += "&" + key + "=" + paramsQuery2[key];});
        
        //console.log(urlQuery2);

        try{
          // Call the url for real and parse the response.
          var response = await fetch(urlQuery2);
          var datas = await response.json();

          var pages = datas.query.pages;

              for (var pg in pages) {

                var revs = pages[pg].revisions;
                for (var rv in revs) {
                  App.articles[revs[rv].revid].url = pages[pg].fullurl;

                // The descrition are available under "revs[rv].slots.main['*']"
                // They have to be sent to IPFS
                // App.articles[revs[rv].revid].rawdescription = await revs[rv].slots.main['*'];  

                  await App.getDescriptionHash(revs[rv].revid);
                }
              }
        }
        catch(error){ console.log(error); }

        startIdx = endIdx;
        endIdx += maxLimit;

      }

      return await App.retrieveOutput();

  },

 /*
  * call the description of the entries
  */

  getDescriptionHash: async function (revid){

    /*** Third query for the description ****/
    //https://de.wikipedia.org/w/api.php?origin=*&action=parse&oldid=926169962&prop=text&format=json

    var urlQuery3 = App.urlPrefix + "?origin=*&action=parse&prop=text&format=json&oldid="+revid;

    App.articles[revid].description = "placeholder for description hashcode";
    // Call the url for real and parse the response.
     
  },

  /*
  * Display the result of the last call on the wikipedia api.
  * Before sending it on the blockchain
  */
  retrieveOutput: async function(){

    // Outputs
    $('#entriesCounter').empty();
    $('#entriesCounter').append(App.counter);

    $('#lastRccontinue').empty();
    $('#lastRccontinue').append(App.lastRccontinue);

    var wikiEntries = $('#lookups-results').empty();  // HTML-Tag for the display of the result
    var wikiEntry = $('#itemurl'); 
    var tableHead = "<div class='col-xs-12 col-md-12'><table class='table'><thead class='bg-primary'><td>#</td><td>pageid</td>"
    +"<td>title</td><td>timestamp</td><td>revision id</td></thead><tbody>", 
        tableTail =" </tbody></table></div>"; // prepare some output wrappers.
    var lookupsResults=""; // tmp variables for the next output
    var tmpSelector ="";

    var num = 0;

   for (var rc in App.articles) {
       num++;            
      // HTML output the main informations pageid, title, revid, change type ...
      lookupsResults+= "<tr style='background-color:#eee;'><td>"+num+"</td><td>"+App.articles[rc].pageid+"</td><td>"+App.articles[rc].title+"</td><td>"+App.articles[rc].timestamp+"</td><td>"
      +rc+"</td></tr>";
      // placeholder for description and urls
      lookupsResults+= "<tr><td></td><td colspan='4' id='urlitem"+rc+"'>"+App.articles[rc].url+"</td></tr>"
      +"<tr><td></td><td colspan='4' id='statusitem"+rc+"' ></td></tr>"
      +"<tr><td></td><td colspan='4' id='descitem"+rc+"' >"+App.articles[rc].description+"</td></tr>";
      //class='d-none'
    }

    lookupsResults = tableHead+lookupsResults+tableTail

    wikiEntries.append(lookupsResults);

    return await App.generateContracts();

  },


  /*
  * Sending the datas for the creations of new  Article Contracts
  */

  generateContracts: async function(){

    try{
      
      var datas = [];
      for (var art in App.articles){
      datas.push(Object.values(App.articles[art]));
      }

      // "generateContracts4Articles" is a method written in our smart contract WikiChain. 
      var result = await App.wikiChainInstance.generateContracts4Articles(datas,{from: App.web3.eth.defaultAccount});

      console.log("Result after generating the smart contract with the wikiChainInstance");
      console.log(result);

      // Present the contract address for the given datas. Some will be added other are already existing.
      App.refreshRetrieveOutput(result);

    }
    catch(error){
      console.log(error);
      alert("***"+error.message+"*** \n\n The Contracts couldn't be generated.  \nPlease Control your connection to the blockchain with Ganache or Metamask.\n\n And restart it if needed.");
    }
    
    // refresh the infobar on the top of the webapp
    return App.refreshInfobar();
  },


  /*
  * Update the previous view with more information from the blockchain.
  *
  */
  refreshRetrieveOutput: async function(result){

    // Outputs

    var ethStatus = $('#eth-status').empty(); 
    var receiptOutput ="<div><h4>receipt from the blockchain</h4></div>"
    +"<div><span class='col-4 col-md-2 eth-label'>Status:</span><span>"+result.receipt.status+"</span></div>"    
    +"<div><span class='col-4 col-md-2 eth-label'>Block Number:</span><span>"+result.receipt.blockNumber+"</span></div>"    
    +"<div><span class='col-4 col-md-2 eth-label'>Gas Used:</span><span>"+result.receipt.gasUsed+"</span></div>"
    +"<div><span class='col-4 col-md-2 eth-label'>Cumulative Gas Used:</span><span>"+result.receipt.cumulativeGasUsed+"</span></div>"
    +"<div><span class='col-4 col-md-2 eth-label'>Block Hash:</span><span class='text-break'>"+result.receipt.blockHash+"</span></div>"
    +"<div><span class='col-4 col-md-2 eth-label'>Transaction Hash:</span><span>"+result.receipt.transactionHash+"</span></div>"
    +"<div><span class='col-4 col-md-2 eth-label'>From:</span><span>"+result.receipt.from+"</span></div>";

    $('#eth-status').append(receiptOutput);   

    var logs = [];
    logs = result.receipt.logs;

    for (var event in logs){
      var args = logs[event].args // address of the contract, url, pagid, revid, message

      var output = "<div class='bg-secondary text-white'>"+"<div><span class='col-2 eth-label'>Event:</span><span>"+logs[event].event+"</span></div>";

      if(logs[event].event == "contractAlreadyExist"){
        output += "<div><span class='col-2 eth-label'>Message:</span><span class='warning'>"+args[4]+"</span></div>";
      }

      output += "<div><span class='col-2 eth-label'>Address: </span><span>"+args[0]+"</span></div>"
      +"<div><span class='col-2 eth-label'>Status:</span><span>"+logs[event].type+"</span></div>"
      +"</div>";

      $('#statusitem'+args[3]).append(output);      

    }

    // If looping is activated ... send a new query an wikipedia api with the actual rccontinue
    if(App.looping){
      App.retrieveAndSaveRecentChanges();
    }
   
  },

 
  /*
  * Display some information about the blockchain in the top of the webapp.
  * #number of registered smart contract for articles
  * @register address
  * @host of the blockchain
  * @default account used for transaction
  * @balance of the default account
  */
  refreshInfobar:async function(){

    var result = await App.wikiChainInstance.getRegisterCounter({from: App.web3.eth.defaultAccount});
    
    var output = "<div>We already have <b>"+result.words[0]+" smart contracts</b> under the register address: "+App.wikiChainInstance.address+"</div>"
    +"<div>connected on the blockchain: <b>"+App.web3.currentProvider.host+"</b></div>"
    +"<div>Using the account: <span>"+App.web3.eth.defaultAccount+"</span>"
    +"<span> with a balance of "+ App.web3.utils.fromWei( String(await App.web3.eth.getBalance(App.web3.eth.defaultAccount)),'ether') +" ETH</span></div>";

     $('#infobar').empty();
     $('#infobar').append(output);
  },

  
  /*
  * Run as loop for the chosen startdate and enddate. The loop request the recent changes and save the new  entries.
  * It will stop, when the wikipedia query won't give information about the next rccontinue.
  *
  */
  retrieveRecursion: async function (event ){

    event.preventDefault();;

    var status = $('#retrieved-status-button').attr('started');
    if(status ==='true'){
      App.looping = false;
      $('#retrieved-status-button').text("Recursion stopped");
      $('#retrieved-status-button').attr('started','false');
    }else{
      App.looping = true;
      $('#retrieved-status-button').text("Recursion started");
      $('#retrieved-status-button').attr('started','true');
      App.retrieveAndSaveRecentChanges();
      
    }
  },

  // simple function to fill automatically the date fields with now() value.
  basicInit: async function(){
    // Set a max date
    var dt = new Date();
    var d = dt.toISOString().split("T")[0];
    var t = dt.toLocaleTimeString().split(":");

    queryStartdate.max = d;
    queryStartdate.value = queryStartdate.max;
    queryEnddate.max = d;
    queryEnddate.value = queryEnddate.max;
    
    queryStarttime.value = t[0]+":"+t[1];
    queryEndtime.value = t[0]+":"+t[1];
  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
