pragma solidity ^0.4.6;

contract identity {
    struct Account {
        string fullIdentity;
        string email;
        string password;
        string pk;
    }

    mapping(uint => Account) Total;
    uint8 Count=0;

    function newAccount(string fullIdentity, string email, string password, string pk) public
    {
        Account memory newAccount;
        newAccount.fullIdentity = fullIdentity;
        newAccount.email= email;
        newAccount.password= password;
        newAccount.pk = pk;
        Total[Count] = newAccount;
        Count++;
    }
    function GetCount() public returns(uint8)
    {
        return Count;
    }

    function getAccount(uint8 CountNo) public returns (string, string, string, string)
    {
    return(Total[CountNo].fullIdentity, Total[CountNo].email, Total[CountNo].password, Total[CountNo].pk);
    }
}
