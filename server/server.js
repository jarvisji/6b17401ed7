/**
 Created by Ting on 2015/7/17.
 */
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var debug = require('debug')('ylb.app');
var conf = require('./conf');

var app = express();
app.use(express.static('client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// connect to MongoDB
if (mongoose.connection.readyState != mongoose.STATES.connected
  && mongoose.connection.readyState != mongoose.STATES.connecting) {
  mongoose.connect(conf.mongoDbUrl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function (callback) {
    debug('Connected to MongoDB success.');
  });
} else {
  debug('Mongoose connection state: ', mongoose.connection.readyState);
}

/**
 * Avoid to get Mongoose error: OverwriteModelError.
 * Since model cannot be compiled twice, so we save compiled models in app.
 */
var registerModels = function () {
  if (!app.models) {
    debug('Resister models...');
    app.models = require('./models');
  }
};

var registerRoutes = function () {
  debug('Register routes...');
  var wechatPublic = require('./middleware/wechat-public-doctor')(app);
  var doctorCtrl = require('./controller/doctor-controller')(app);
  var wechatCtrl = require('./controller/wechat-controller')(app);
  //app.use('/wxproxy', function(req, res, next){
  //  debug('Got request data: ', req.body);
  //  next();
  //});
  app.use('/wxproxy', wechatPublic); // rename to /wxproxy-doctor
  app.post('/wechat/menu', wechatCtrl.createMenu);
  //app.post('/doctors', doctorCtrl.createDoctor);
  app.get('/doctors', doctorCtrl.getDoctors);
};

var startServer = function () {
// start the server if `$ node server.js`
  if (require.main === module) {
    var server = app.listen('3001', function () {
      var host = server.address().address;
      var port = server.address().port;
      debug('Server listening at: http://%s:%s', host, port);
    });
  }
};

registerModels();
registerRoutes();
startServer();
module.exports = app;
