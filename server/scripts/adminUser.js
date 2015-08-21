/**
 * Tool to create or update admin user, only runs on server by manually
 * Usage: node adminUser username password
 * Created by Ting on 2015/8/19.
 */
var mongoose = require('mongoose');
var sha512 = require('crypto-js/sha512');
var debug = require('debug')('ylb.adminUser');
var conf = require('../conf');
var models = require('../models');

var AdminUser = models.AdminUser;

var connectDB = function () {
  if (mongoose.connection.readyState != mongoose.STATES.connected && mongoose.connection.readyState != mongoose.STATES.connecting) {
    debug('Connecting to MongoDB: %s', conf.mongoDbUrl);
    mongoose.connect(conf.mongoDbUrl);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function (callback) {
      debug('Connected to MongoDB success');
      doUpdateAdmin();
    });
  } else {
    debug('Mongoose connection state: ', mongoose.connection.readyState);
  }
};

if (require.main === module) {
  connectDB();
}

var doUpdateAdmin = function () {
  // An array containing the command line arguments.
  // The first element will be 'node', the second element will be the name of the JavaScript file.
  // The next elements will be any additional command line arguments.
  // https://nodejs.org/api/process.html#process_process_argv
  var username, password;
  if (process.argv.length > 2) {
    username = process.argv[2];
    password = process.argv[3];
  }
  if (!username || !password) {
    console.log('Usage: node adminUser username password');
    process.exit(1);
  }

  var adminUser = {username: username, password: password};
  adminUser.salt = Math.round((new Date().valueOf() * Math.random()));
  adminUser.password = sha512(adminUser.salt + adminUser.password).toString();
  AdminUser.update({username: username}, adminUser, {upsert: true}, function (err, raw) {
    if (err) {
      console.log('error: %o', err);
    } else {
      console.log('User created/updated');
    }
    process.exit();
  });
};
