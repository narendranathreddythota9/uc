


var express = require('express');
var app = express();
var exphbs = require('express-handlebars');
var util=require('util');
var bodyParser = require('body-parser');
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));
var value=web3.utils.toWei('0.8', 'ether');
require('dotenv').config();


web3.eth.sendTransaction({
    from: process.env.SEND_ADDRESS,
    to: process.env.LAKSHMI_ADDRESS,
    value: value
})
.then(function(receipt){
    console.log(receipt);
});
