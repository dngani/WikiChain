App = {
  web3Provider: null,
  contracts: {},
  articles: {}, // These pages will be parse and prepare for the blockchain
  urlPrefix: "https://de.wikipedia.org/w/api.php", // The used version of wikipedia

  // Articles contens for the contracts
  lastRccontinue: 0,
  revids: [],
  counter: 0,

  init: async function() {
    // Some basic settings in frontend
    App.basicInit();

    // Try to connect to the blockchain
    return await App.initWeb3();
  },

  initWeb3: async function() {
    
    /*
    var web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

    */
     // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      App.web3 = new Web3(web3.currentProvider);
    } else {
      // If no injected web3 instance is detected, fallback to Ganache.
      App.web3Provider = new web3.providers.HttpProvider('http://127.0.0.1:8545');
      App.web3 = new Web3(App.web3Provider);
    } 

   // Modern dapp browsers...
   /* if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider); */

    console.log(web3);

    return App.initContract();
  },

  initContract: function() {
     $.getJSON('WikiChain.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var WikiChainArtifact = data;
      App.contracts.WikiChain = TruffleContract(WikiChainArtifact);

      // Set the provider for our contract
      App.contracts.WikiChain.setProvider(App.web3Provider);
    });
  },

  /*
  * Retrieving new entries from wikipedia
  */

  retrieveAndSaveRecentChanges: async function(event){

    /* stop form from submitting normally */
    event.preventDefault();
    // /w/api.php?action=query&format=json&prop=info%7Crevisions&revids=97456942%7C207495&inprop=url&rvprop=ids%7Ccontent

    // reset global variables
    contracts = {},
    articles = {}, // These pages will be parse and prepare for the blockchain
    lastRccontinue = 0,
    revids = [],
    counter = 0;

    /*** First query searching for the recent changes for a given time frame. ****/
    // example: https://en.wikipedia.org/w/api.php?origin=*&action=query&list=recentchanges&rcprop=title|ids|timestamp|flags&rclimit=20&rctype=edit|new&rcstart=2019-11-15T15:00:00.000Z&rcend=2019-11-15T16:01:00.000Z&rcnamespace=0&rcdir=newer&format=json
    
    // a mark where the query result stop. We can continue fechting up here...
    //var lastRccontinue =0; // If the result is more than 500, we need to mark the next revision we should work with.
    
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

    var url = App.urlPrefix + "?origin=*";
    // build the final url with the given parameters.
    Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
    
    console.log(url);

    // Call the url for real and parse the response.
    fetch(url)
        .then(function(response){return response.json();})
        .then(function(response) {
            if (typeof response.continue !== "undefined"){ // occurs most when qStarttime == qEndtime
              lastRccontinue = response.continue.rccontinue; // doesn't exit if rcstart and rcsend are the same.
            }
            
            var recentchanges = response.query.recentchanges;
            
            for (var rc in recentchanges) {
                
                App.revids[App.counter] = recentchanges[rc].revid;
                var id = recentchanges[rc].revid;
                App.articles[id] = {}
                App.articles[id].pageid = recentchanges[rc].pageid;
                App.articles[id].revid = id;
                App.articles[id].title = recentchanges[rc].title;
                App.articles[id].timestamp = recentchanges[rc].timestamp;
                //App.articles[id].url = "testurl";
                //App.articles[id].description = "test desc";
                App.counter++;
            }

            return App.getUrls();
           
        }).catch(function(error){console.log(error);}); //End

  }, // End of the retrieve and Save.

  getUrls: function (){

     var maxLimit = 50, limit = queryLimit.value, startIdx=0, endIdx = limit % maxLimit;
       
      //console.log("limit:"+limit+"\tstartIdx:"+startIdx+"\tendIdx:"+endIdx+"\tmaxLimit:"+maxLimit);
      //console.log(App.revids);

      if(startIdx == endIdx){
        endIdx = maxLimit;
      }

      while( startIdx < limit && startIdx <= endIdx ) { 
        var ids = "";
        for( var idx = startIdx; idx < endIdx; idx++){
          ids += App.revids[idx]+"|";
        }
        ids = ids.substring(0, ids.length - 1);

        //console.log(ids);
       
        //https://de.wikipedia.org/w/api.php?action=query&revids=207495|97456942&prop=info|revisions&inprop=url&format=json
        var paramsQuery2 = {
            action: "query",
            revids: ids,  //limit 50
            prop: "info|revisions",
            inprop: "url",
            format: "json"
        };

        var urlQuery2 = App.urlPrefix + "?origin=*";
        // build the final url with the given parameters.
        Object.keys(paramsQuery2).forEach(function(key){urlQuery2 += "&" + key + "=" + paramsQuery2[key];});
        
        console.log(urlQuery2);
        // Call the url for real and parse the response.
        fetch(urlQuery2)
          .then(function(response){return response.json();})
          .then(function(response) {

              var pages = response.query.pages;

              for (var pg in pages) {
                /*var url = new Object();
                url.pageid = pages[pg].pageid;
                url.fullurl = pages[pg].fullurl;
                App.fullurls.push(url); */

                var revs = pages[pg].revisions;
                for (var rv in revs) {
                  App.articles[revs[rv].revid].url = pages[pg].fullurl;
                  App.getDescription(revs[rv].revid);
                }
                //alert(lastdesc instanceof Promise);
              }
          })
          .catch(function(error){console.log(error);}); //End

        startIdx = endIdx;
        endIdx += maxLimit;

      }
      
      return App.generateContracts();

  },

 /*
  * call the description of the entries
  */

  getDescription: function (revid){

    /*** Third query for the description ****/
    //https://de.wikipedia.org/w/api.php?origin=*&action=parse&oldid=926169962&prop=text&format=json

    var urlQuery3 = App.urlPrefix + "?origin=*&action=parse&prop=text&format=json&oldid="+revid;

    App.articles[revid].description = "description for revid:"+revid;
    //console.log(url);
      // Call the url for real and parse the response.
     
  },

  /*
  * Retrieving new entries from wikipedia
  */

  generateContracts: function(){

    var wikiChainInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.WikiChain.deployed().then(function(instance) {
        wikiChainInstance = instance;

        console.log(wikiChainInstance);

       setTimeout(function(){
          // loop over all articles, we have found and transform it to a  2-dim array
          var datas = [];
          for (var art in App.articles){
            datas.push(Object.values(App.articles[art]));
          }
          console.log(datas);
          var myJsonString = JSON.stringify(datas);
          console.log(myJsonString);

          // Generate the contracts on the blockchain
          var result = wikiChainInstance.generateContracts4Articles(myJsonString, {from: account});

          return result; 
         }, 2000);
        // var result = wikiChainInstance.generateContracts4Articles(datas);
   
        

      }).then(function(result) {
       console.log(result);
       return App.refreshOutput();
        //return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  

  },

  refreshOutput: async function(){

    // Outputs
    var wikiEntries = $('#lookups-results').empty();  // HTML-Tag for the display of the result
    var wikiEntry = $('#itemurl'); 
    var tableHead = "<div class='col-xs-12 col-md-12'><table class='table'><thead class='bg-primary'><td>#</td><td>pageid</td>"
    +"<td>title</td><td>timestamp</td><td>revision id</td><td></td></thead><tbody>", 
        tableTail =" </tbody></table></div>"; // prepare some output wrappers.
    var lookupsResults=""; // tmp variables for the next output
    var tmpSelector ="";

    var num = 0;
     /*** OUTPUT ****/
    //console.log(App.recentchanges);
    //console.log(App.fullurls);
    //console.log(App.descriptions);

   for (var rc in App.articles) {
       num++;            
      // HTML output the main informations pageid, title, revid, change type ...
      lookupsResults+= "<tr><td>"+num+"</td><td>"+App.articles[rc].pageid+"</td><td>"+App.articles[rc].title+"</td><td>"+App.articles[rc].timestamp+"</td><td>"
      +rc+"</td><td><button id='item"+rc+"'> Mehr Details</button></td></tr>";
      // placeholder for description and urls
      lookupsResults+= "<tr><td></td><td colspan='4' id='urlitem"+rc+"'>"+App.articles[rc].url+
      "</td></tr><tr><td></td><td colspan='4' id='descitem"+rc+"' class='d-none'>"+App.articles[rc].description+"</td></tr>";
      console.log(App.articles[rc].description);
    }

    lookupsResults = "<div class='col-xs-12 col-md-12'>We retrieved "+App.counter+ " Entries.<br> The last rccontinue is:"+App.lastRccontinue+"</div>"+tableHead+lookupsResults+tableTail

    wikiEntries.append(lookupsResults);

  },

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
