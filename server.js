var express = require('express');
var app = express();
var path = require('path');
var exphbs = require('express-handlebars');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/doctor";
var util = require('util');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));


//Authentication Packages
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


//Bodey Parser Middleware
const hbsHelpers = require('./helper');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({
  defaultLayout: 'layout',
  helpers: hbsHelpers
}));
app.set('view engine', 'handlebars');
app.use(express.static('public'));
app.use(expressValidator());
//end view Engine for handlebars

app.use(cookieParser());

//session
app.use(session({
  secret: 'sdfksnfkgnskntdhdghrgnsjdhnsaklfjlkhashslkafj',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    url: 'mongodb://localhost:27017/doctor'
  })
  //cookie: { secure: true }
}))
app.use(passport.initialize());
app.use(passport.session());


// Connect Flash
app.use(flash());

// Global Vars
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

//  !!!!!!!!!!!!   very very important !!!!!!!!!!!    caching disabled for every route
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});
//  !!!!!!!!!!!!   very very important !!!!!!!!!!!    caching disabled for every route

var server = app.listen(7085, function() {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})

//  very Important this is for html socket !!!!!!
var io = require('socket.io').listen(server);
//  very Important this is for html socket !!!!!
module.exports = io;

//routes
var routes = require('./routes/main');
app.use('/', routes);
