pragma solidity ^0.4.6;

contract ARTICAL

{

    struct Article{
        string title;
        string writer;
        string status1;
        string source1;
        string comment;
        string article;
        uint createDate;
        uint updateDate;
    }

    mapping(uint => Article) Total;
    uint8 Count=0;

    function addNewArticle(string title, string writer,string status1, string source1, string comment, string article)
    {

        Article memory newArticle;
        newArticle.title= title;
        newArticle.writer= writer;
        newArticle.status1= status1;
        newArticle.source1= source1;
        newArticle.comment= comment;
        newArticle.article= article;
        newArticle.createDate = now;
        newArticle.updateDate = now;
        Total[Count] = newArticle;
        Count++;

    }

    function updateArticle(uint8 CountNo, string status1)
    {

        Total[CountNo].status1= status1;
        Total[CountNo].updateDate = now;

    }


    function GetCount() returns(uint8){
        return Count;
    }

    function getArticle(uint8 CountNo) returns (string, string ,string , string , string , string )
    {
        return (Total[CountNo].title, Total[CountNo].writer,Total[CountNo].status1,Total[CountNo].source1,Total[CountNo].comment,Total[CountNo].article );
    }
}
