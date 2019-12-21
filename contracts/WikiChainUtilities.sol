pragma solidity ^0.5.0;

library WikiChainUtilities {
    
     struct Article {
        uint pageid;
        uint revid;
        string title;
        string lastmodified;
        string url;
        string description;
    }
    
     struct Address2Id {
        address payable contractaddress;
        uint revid;
        uint pageid;
    }
    
    struct ArticleOutput{
        address myaddress;
        uint pageid;
        uint revid;
        string url;
        string title;
        string description;
        string lastmodified;
    }
    
}