
var MongoClient = require('mongodb').MongoClient;

function MongoSingle (addr, options, cb) {
  if (options instanceof Function) {
    cb = options;
    options = null;
  }
  if (addr === undefined) {
    if (cb !== undefined) cb('No address found');
    return new Error('No address found');
  }
  if (MongoSingle.prototype._dbs[addr] !== undefined) return MongoSingle.prototype._dbs[addr];
  MongoClient.connect(addr, options, function (e, db) {
    if (db) MongoSingle.prototype._dbs[addr] = db;
    if (cb !== undefined) cb(e, db);
  });
}

MongoSingle.prototype._dbs = {};

exports = module.exports = MongoSingle;
