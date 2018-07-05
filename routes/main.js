var express = require('express');
var router = express.Router();
require('dotenv').config();
var bcrypt = require('bcrypt');
const saltRounds = 10;
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = process.env.DB_URL;
var ObjectID=require('mongodb').ObjectID;
var io = require('../server');
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(process.env.WEB3_PROVIDER));
var coinbase = process.env.COINBASE;
function balance(bal){
	console.log(bal);
	web3.eth.getBalance(bal)
	.then(console.log);
}
web3.eth.getCoinbase()
.then(balance);

//Authentication Packages
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var lakshmiABI = ([{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"totalsupply","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"RATE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"UstToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"createTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]);
var lakshmiContractAddr = process.env.LAKSHMI_ADDRESS;

router.get('/', function (req, res) {
   res.render( 'login');
})


router.get('/writer',authenticationMiddleware(), function (req, res) {
   res.render( 'writer');
})

router.post('/accept/reject',authenticationMiddleware(), function (req, res) {
   if(req.body.accept === "accept"){
     var display={'pk':1,_id:0}
     var result = [];
     MongoClient.connect(url, function(err, db) {
     var check = db.collection('register').find({"fullIdentity":req.body.user},display);
     check.forEach(function(doc, err) {
       result.push(doc);
     });
     const contractInstance = new web3.eth.Contract(lakshmiABI, lakshmiContractAddr);
     var query = new mongo.ObjectID(req.user);
     var rule={'fullIdentity':1,'pk':1,_id:0}
     var loginUser = db.collection('register').find(query,rule);
     loginUser.forEach(function(doc, err) {
       result.push(doc);
     }, function() {
       function statusBack(){
         db.collection('loaner').updateOne({username:result[1].fullIdentity,"borrower.money":req.body.money},{$set: {"borrower.$.status":"Accepted"}});
         db.collection('register').updateOne({fullIdentity:req.body.user,"reqsent.money":req.body.money},{$set: {"reqsent.$.status":"Accepted"}});
       }
       contractInstance.methods.transfer(result[0].pk, web3.utils.toWei(req.body.money, 'ether')).send({from:result[1].pk})
      .then(result => {
       console.log(result.transactionHash);
       statusBack();
         });
     });
     result.length = 0;
   });
   res.redirect('/wallet');
 }else if(req.body.reject === "reject"){
    var myArray = [];
     MongoClient.connect(url, function(err, db) {
       var query = new mongo.ObjectID(req.user);
       var display={'fullIdentity':1,_id:0}
       var check = db.collection('register').find(query,display);
       check.forEach(function(doc, err) {
         myArray.push(doc);
       }, function() {
         db.collection('loaner').updateOne({username:myArray[0].fullIdentity,"borrower.money":req.body.money},{$set: {"borrower.$.status":"Rejected"}});
         db.collection('register').updateOne({fullIdentity:req.body.user,"reqsent.money":req.body.money},{$set: {"reqsent.$.status":"Rejected"}});
       });
       myArray.length = 0;
  });
   }
   res.redirect('/requestin');
})
router.get('/requestin', authenticationMiddleware(), function (req, res) {
MongoClient.connect(url, function(err, db) {
  var result = [];
  var loanreq = [];
  var  user=req.user;
  var query = new mongo.ObjectID(req.user);
  var display={'fullIdentity':1,_id:0}
  var check = db.collection('register').find(query,display);
  check.forEach(function(doc, err) {
    result.push(doc);
  }, function() {
    var cursor = db.collection('loaner').find({username:result[0].fullIdentity},{'borrower':1,_id:0});
      cursor.forEach(function(doc, err) {
        loanreq.push(doc.borrower);
      }, function() {
            res.render('requestin', {
            loaners: loanreq[0],
             helpers: {
               equal: function(lvalue, rvalue, options) {
                     if (arguments.length < 3)
                         throw new Error("Handlebars Helper equal needs 2 parameters");
                     if( lvalue === rvalue ) {
                         return options.fn(this);
                     } else {
                         return options.inverse(this);
                     }
                 }
            }
          });
      });
  });
  loanreq.length = 0;
  result.length = 0;
          });
})
router.get('/requestout', authenticationMiddleware(), function (req, res) {
  var result = [];
MongoClient.connect(url, function(err, db) {
    var  user=req.user;
    var query = new mongo.ObjectID(req.user);
    var cursor = db.collection('register').find(query,{'reqsent':1,_id:0});
      cursor.forEach(function(doc, err) {
        result.push(doc.reqsent);
      },function(){
            res.render('requestout', {
            requests:result[0],
             helpers: {
               equal: function(lvalue, rvalue, options) {
                     if (arguments.length < 3)
                         throw new Error("Handlebars Helper equal needs 2 parameters");
                     if( lvalue === rvalue ) {
                         return options.fn(this);
                     } else {
                         return options.inverse(this);
                     }
                 }
            }
          });
      });
      result.length = 0;
          });
});
router.get('/reader',authenticationMiddleware(), function (req, res) {
  var result = [];
MongoClient.connect(url, function(err, db) {
  var cursor = db.collection('loaner').find({});
    cursor.forEach(function(doc, err) {
      result.push(doc);
    }, function() {
          res.render('reader', {
          loaners: result,
           helpers: {
             equal: function(lvalue, rvalue, options) {
                   if (arguments.length < 3)
                       throw new Error("Handlebars Helper equal needs 2 parameters");
                   if( lvalue === rvalue ) {
                       return options.fn(this);
                   } else {
                       return options.inverse(this);
                   }
               }
          }
        });
    });
    result.length = 0;
          });
});
router.get('/wallet',authenticationMiddleware(), function (req, res1) {
  MongoClient.connect(url, function(err, db){
  var AccContract = ([{"constant":false,"inputs":[],"name":"GetCount","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"fullIdentity","type":"string"},{"name":"email","type":"string"},{"name":"password","type":"string"},{"name":"pk","type":"string"}],"name":"newAccount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"CountNo","type":"uint8"}],"name":"getAccount","outputs":[{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]);
  var result = [];
  var  user=req.user;
  var query = new mongo.ObjectID(req.user);
  var display={'contractAddress':1,_id:0}
  var cursor = db.collection('register').find(query,display);
    cursor.forEach(function(doc, err) {
      result.push(doc);
    }, function() {
  const Acc = new web3.eth.Contract(AccContract, result[0].contractAddress);
  Acc.methods.GetCount().call(function (error, Count){
  Acc.methods.getAccount(Count-1).call(function(err, res){
    var array = [];
    array.push({"username":res[0]},{"email":res[1]},{"pk":res[3]})
    const contractInstance = new web3.eth.Contract(lakshmiABI, lakshmiContractAddr);
    contractInstance.methods.balanceOf(res[3]).call()
    .then(result => {
    	var bal = new web3.utils.BN(result);
      array.push({"token":web3.utils.fromWei(bal, 'ether')});
        });
      web3.eth.getBalance(res[3])
      .then(balance =>{
        array.push({"bal":web3.utils.fromWei(balance, 'ether')});
    		     });
             contractInstance.methods.name().call()
            .then(result => {
            array.push({"tname":result});
             });
            contractInstance.methods.symbol().call()
            .then(result => {
            array.push({"tsymbol":result});
            res1.render('wallet', {result: array});
             });
           })
         })
       })
     });
    });
router.post('/need',authenticationMiddleware(), function(req,res){
  if(req.body.moneyreq !== undefined){
  var result1 = [];
  var result = [];
MongoClient.connect(url, function(err, db) {
  var name = {'username':req.body.moneyreq};
  var query = new mongo.ObjectID(req.user);
  var id={'_id':query}
  var loan = db.collection('loaner').find(name);
    loan.forEach(function(doc, err) {
      var sent={
        username:doc.username,
        time:doc.time,
        rate:doc.rate,
        max:doc.max,
        money:req.body.money,
        status:"Pending"
      }
      db.collection('register').update(id,{$push:{reqsent:sent}});
    });
    var output = db.collection('register').find(id);
      output.forEach(function(doc, err) {
        var sent1={
          username:doc.fullIdentity,
          status:"Pending",
          pk:doc.pk,
          money:req.body.money,
          reputation:doc.reputation,
          email:doc.email
        }
        db.collection('loaner').update(name,{$push:{borrower:sent1}});
      });
  var cursor = db.collection('loaner').find({});
    cursor.forEach(function(doc, err) {
      result.push(doc);
    }, function() {
          res.render('reader', {
          loaners: result,
          success:"Successfully sent money request",
           helpers: {
             equal: function(lvalue, rvalue, options) {
                   if (arguments.length < 3)
                       throw new Error("Handlebars Helper equal needs 2 parameters");
                   if( lvalue === rvalue ) {
                       return options.fn(this);
                   } else {
                       return options.inverse(this);
                   }
               }
          }
        });
    });
          });
          result.length = 0;
          result1.length = 0;
        }else{
          res.redirect('/reader');
        }
    });
router.post('/loaners/search',authenticationMiddleware(), function(req,res1){
  var result = [];
MongoClient.connect(url, function(err, db) {
  var qselect = req.body.search_categories;
  switch(qselect){
    case 'rate':
    var query = { 'rate': req.body.searchValue };
    break;
    case 'username':
    var query = { 'username': req.body.searchValue };
    break;
    case 'time':
    var query = { 'time': req.body.searchValue };
    break;
    case 'status':
    var query = { 'status': req.body.searchValue };
    break;
    case 'max':
    var query = { 'max': req.body.searchValue };
    break;
    case '':
    var query = {};
    break;
  }
var cursor = db.collection('loaner').find(query);
  cursor.forEach(function(doc, err) {
    result.push(doc);
  }, function() {
        res1.render('reader', {
        loaners: result,
         helpers: {
           equal: function(lvalue, rvalue, options) {
                 if (arguments.length < 3)
                     throw new Error("Handlebars Helper equal needs 2 parameters");
                 if( lvalue === rvalue ) {
                     return options.fn(this);
                 } else {
                     return options.inverse(this);
                 }
             }
        }
      });
  });
          });
});
passport.use(new LocalStrategy(
  function(username, password, done) {
      MongoClient.connect(url, function(err, db){
    var AccContract = ([{"constant":false,"inputs":[],"name":"GetCount","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"fullIdentity","type":"string"},{"name":"email","type":"string"},{"name":"password","type":"string"},{"name":"pk","type":"string"}],"name":"newAccount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"CountNo","type":"uint8"}],"name":"getAccount","outputs":[{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]);
    var query;
    if(/\@/.test(username)){
      var query = {'email':username};
    }else{
      var query = {'fullIdentity':username};
    }
    var result = [];

    var display={'contractAddress':1}
    var cursor = db.collection('register').find(query,display);
      cursor.forEach(function(doc, err) {
        result.push(doc);
      }, function() {
if(result[0]==undefined){
  return done(null,false, {message:'!!! New to TruthChain? Please SignUp !!!'})
}else{
  const Acc = new web3.eth.Contract(AccContract, result[0].contractAddress);
  Acc.methods.GetCount().call(function (error, Count){
  Acc.methods.getAccount(Count-1).call(function(err, res){
  var one = new String(password);
  var two = new String(res[2]);
  bcrypt.compare(password, res[2]).then(function(res) {

    if(res){
          const user_id=result[0]._id;
          return done(null,user_id, {message: ' Successfully Authenticated'})
        }else {
        return done(null,false, {message:'!!! User Credentials are wrong !!!'})
         }
       });
    });
  });
}
 });
});
}
));

router.post('/login',passport.authenticate('local', {successRedirect:'/wallet', failureRedirect:'/', badRequestMessage : 'Missing username or password.',
    failureFlash: true}), function (req, res1) {
})


router.post('/offers',authenticationMiddleware(), function (req, res1) {
  req.checkBody('time', 'time-period field cannot be empty').notEmpty();
  req.checkBody('rate', 'status field cannot be empty').notEmpty();
  req.checkBody('max', 'source field cannot be empty').notEmpty();
  req.checkBody('comment', 'article field cannot be empty').notEmpty();
  const errors = req.validationErrors();
  if(errors){
  res1.render('writer', {errors:"Please check all fields"});
  }else{
  MongoClient.connect(url, function(err, db){
  var time = req.body.time;
  var rate = req.body.rate;
  var max = req.body.max;
  var comment = req.body.comment;
      var result = [];
      var  user=req.user;
      var query = new mongo.ObjectID(req.user);
      var display={'fullIdentity':1,_id:0}
      var cursor = db.collection('register').find(query,display);
        cursor.forEach(function(doc, err) {
          result.push(doc);
        }, function() {

          var myobj = {
             username:result[0].fullIdentity,
             time:time,
             rate: rate,
             max: max,
             status:"Active",
             borrower: [],
             comment: comment,
          }
           db.collection("loaner").insertOne(myobj, function(err, doc) {
          if (err) {
              throw err;
          }
          });

 res1.render('writer',{ok:'Successfully created Offer'});
})
    });
}
});

router.post('/register', function (req, res) {
  req.checkBody('fullIdentity', 'username cannot be empty').notEmpty();
  req.checkBody('email', 'E-mail cannot be empty').notEmpty();
  req.checkBody('password', 'Password cannot be empty').notEmpty();
  const errors = req.validationErrors();
  if(errors){
  res.render('register', {errors:errors});
  }else{
  MongoClient.connect(url, function(err, db) {
  var result = [];
  var query = {'fullIdentity':req.body.fullIdentity};
  var display={'contractAddress':1}
  var cursor = db.collection('register').find(query,display);
    cursor.forEach(function(doc, err) {
      result.push(doc);
    }, function() {
    if(result[0]==undefined){
      var fullIdentity = req.body.fullIdentity;
      var email=req.body.email;
      bcrypt.hash(req.body.password, saltRounds, function(err, passHash) {
      var abiContract = ([{"constant":false,"inputs":[],"name":"GetCount","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"fullIdentity","type":"string"},{"name":"email","type":"string"},{"name":"password","type":"string"},{"name":"pk","type":"string"}],"name":"newAccount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"CountNo","type":"uint8"}],"name":"getAccount","outputs":[{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]);
      idCode = ("0x60606040526000600160006101000a81548160ff021916908360ff160217905550341561002b57600080fd5b6108e58061003a6000396000f300606060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680630ab939711461005c5780635768dd881461008b5780636c3aa54d146101b1575b600080fd5b341561006757600080fd5b61006f610394565b604051808260ff1660ff16815260200191505060405180910390f35b341561009657600080fd5b6101af600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f016020809104026020016040519081016040528093929190818152602001838380828437820191505050505050919050506103ab565b005b34156101bc57600080fd5b6101d5600480803560ff169060200190919050506104ac565b6040518080602001806020018060200180602001858103855289818151815260200191508051906020019080838360005b83811015610221578082015181840152602081019050610206565b50505050905090810190601f16801561024e5780820380516001836020036101000a031916815260200191505b50858103845288818151815260200191508051906020019080838360005b8381101561028757808201518184015260208101905061026c565b50505050905090810190601f1680156102b45780820380516001836020036101000a031916815260200191505b50858103835287818151815260200191508051906020019080838360005b838110156102ed5780820151818401526020810190506102d2565b50505050905090810190601f16801561031a5780820380516001836020036101000a031916815260200191505b50858103825286818151815260200191508051906020019080838360005b83811015610353578082015181840152602081019050610338565b50505050905090810190601f1680156103805780820380516001836020036101000a031916815260200191505b509850505050505050505060405180910390f35b6000600160009054906101000a900460ff16905090565b6103b36107ab565b84816000018190525083816020018190525082816040018190525081816060018190525080600080600160009054906101000a900460ff1660ff16815260200190815260200160002060008201518160000190805190602001906104189291906107ec565b5060208201518160010190805190602001906104359291906107ec565b5060408201518160020190805190602001906104529291906107ec565b50606082015181600301908051906020019061046f9291906107ec565b509050506001600081819054906101000a900460ff168092919060010191906101000a81548160ff021916908360ff160217905550505050505050565b6104b461086c565b6104bc61086c565b6104c461086c565b6104cc61086c565b6000808660ff1681526020019081526020016000206000016000808760ff1681526020019081526020016000206001016000808860ff1681526020019081526020016000206002016000808960ff168152602001908152602001600020600301838054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156105c15780601f10610596576101008083540402835291602001916105c1565b820191906000526020600020905b8154815290600101906020018083116105a457829003601f168201915b50505050509350828054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561065d5780601f106106325761010080835404028352916020019161065d565b820191906000526020600020905b81548152906001019060200180831161064057829003601f168201915b50505050509250818054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156106f95780601f106106ce576101008083540402835291602001916106f9565b820191906000526020600020905b8154815290600101906020018083116106dc57829003601f168201915b50505050509150808054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156107955780601f1061076a57610100808354040283529160200191610795565b820191906000526020600020905b81548152906001019060200180831161077857829003601f168201915b5050505050905093509350935093509193509193565b6080604051908101604052806107bf610880565b81526020016107cc610880565b81526020016107d9610880565b81526020016107e6610880565b81525090565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061082d57805160ff191683800117855561085b565b8280016001018555821561085b579182015b8281111561085a57825182559160200191906001019061083f565b5b5090506108689190610894565b5090565b602060405190810160405280600081525090565b602060405190810160405280600081525090565b6108b691905b808211156108b257600081600090555060010161089a565b5090565b905600a165627a7a72305820895c27412bfce8ec988dd39fd7d27db1bf536d20267269f248c9c6d87aa589e20029");

      const MyContract = new web3.eth.Contract(abiContract);
      MyContract.deploy({data: idCode}).send({from:coinbase, gas: 4700000})
      .on('error', function(error){
        res.render('register', {error:'Error Please report to Admin'});
       })
      .then((instance) => {
        const identityContract = new web3.eth.Contract(abiContract, instance.options.address);
        var pk;
        web3.eth.personal.newAccount(req.body.password)
        .then(function(doc){
        pk = doc;
        send();
        });
        function send(){
          var value=web3.utils.toWei('1', 'ether');
          web3.eth.sendTransaction({
              from: coinbase,
              to: pk,
              value: value
          })
          .then(function(receipt){
              test();
          });
        }
        function test(){
       web3.eth.personal.unlockAccount(pk,req.body.password);
       identityContract.methods.newAccount(fullIdentity, email, passHash, pk).send({from:coinbase, gas: 4712388,
       gasPrice: 100000000000}, function(error){
         if(error){
             //console.log(error);
             res.render('register', {errors:'Error While creating Identity '});
         }else {
                 if (err) throw err;
                 var myobj = {
                   contractAddress:instance.options.address,
                    fullIdentity: fullIdentity,
                    email: email,
                    reputation:0,
                    reqsent:[],
                    pk: pk
                 }
                  db.collection("register").insertOne(myobj, function(err, doc) {
                 if (err) {
                     throw err;
                 }
                 else{
                 res.redirect('/');
                 }

                 });
            }
         })
       }
    });
});
}else{
res.render('register', {error:'username already Exist'});
}
});
});
}

});

router.get('/register', function (req, res) {

  res.render('register');

});

router.get('/logout', function(req, res){
  //req.flash('success_msg', 'You are logged out');
	req.logout();
  req.session.destroy(function() {
  res.status(200).clearCookie('connect.sid', {path: '/'}).json({status: "Success"});
  res.redirect('/');
});

	res.redirect('/');
});
passport.serializeUser(function(user_id, done) {
  done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});
function authenticationMiddleware () {
	return (req, res, next) => {
		console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
	    if (req.isAuthenticated()) return next();
	    res.redirect('/')
	}
}

module.exports = router;
