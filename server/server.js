/**
 Created by Ting on 2015/7/17.
 */
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var wechatApi = require('wechat-api');
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
  var api = new wechatApi(conf.wechat.appid, conf.wechat.appsecret);
  var wxproxyDoctor = require('./middleware/wxproxy-doctor')(app, api);
  var doctorCtrl = require('./controller/doctor-controller')(app);
  var wechatCtrl = require('./controller/wechat-controller')(app, api);

  // TODO: add authentication for following APIs.
  app.use('/wxproxy', wxproxyDoctor); // TODO: rename to /wxproxy-doctor
  app.post('/wechat/menu', wechatCtrl.createMenu);
  app.get('/wechat/jssdkconfig', wechatCtrl.getJsSdkConfig);
  app.post('/api/doctors', doctorCtrl.createDoctor);
  app.get('/api/doctors', doctorCtrl.findDoctors);
  app.put('/api/doctors/:id', doctorCtrl.saveDoctor);
};

var startServer = function () {
// start the server if `$ node server.js`
  if (require.main === module) {
    var server = app.listen('3001', '0.0.0.0', function () {
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
