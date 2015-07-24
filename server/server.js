/**
 Created by Ting on 2015/7/17.
 */
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var wechatApi = require('wechat-api');
var OAuth = require('wechat-oauth');
var debug = require('debug')('ylb.app');
var conf = require('./conf');

var app = express();
app.use(express.static('client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// connect to MongoDB
if (mongoose.connection.readyState != mongoose.STATES.connected && mongoose.connection.readyState != mongoose.STATES.connecting) {
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
  var oauth = new OAuth(conf.wechat.appid, conf.wechat.appsecret);
  var wxproxyDoctor = require('./middleware/wxproxy-doctor')(app, api);
  var wxproxyPatient = require('./middleware/wxproxy-patient')(app, api);
  var doctorCtrl = require('./controller/doctor-controller')(app);
  var patientCtrl = require('./controller/patient-controller')(app);
  var wechatCtrl = require('./controller/wechat-controller')(app, api, oauth);

  // TODO: add authentication for following APIs.
  app.use('/wxproxy', wxproxyDoctor); // TODO: delete this.
  app.use('/wxproxy-doctor', wxproxyDoctor);
  app.use('/wxproxy-patient', wxproxyPatient);

  app.post('/wechat/menu', wechatCtrl.createMenu);
  app.get('/wechat/jssdkconfig', wechatCtrl.getJsSdkConfig);
  app.get('/api/verify', wechatCtrl.verifyAccessToken); // verify openid and access_token, then return registered user information.

  app.post('/api/doctors', doctorCtrl.createDoctor);
  app.get('/api/doctors', doctorCtrl.findDoctors);
  app.put('/api/doctors/:id', doctorCtrl.saveDoctor);

  app.get('/api/patients', patientCtrl.find);
  app.put('/api/patients/:id', patientCtrl.save);

  /**
   * GET '/api/patients/:id/follows?[expand=true]'
   * Get doctors list that a patient follows.
   */
  app.get('/api/patients/:id/follows', patientCtrl.getFollows);
  /**
   * POST '/api/patients/:id/follows'
   * @Data: {"doctorId":"string"}
   */
  app.post('/api/patients/:id/follows', patientCtrl.createFollow);
  /**
   * Check patient is followed a doctor or not.
   * GET '/api/patients/:id/follows/:doctorId'
   * @Response: {data: true/false}
   */
  app.get('/api/patients/:id/follows/:doctorId', patientCtrl.isFollowed);
  app.delete('/api/patients/:id/follows/:doctorId', patientCtrl.deleteFollow);
};

var startServer = function () {
// start the server if `$ node server.js`
  if (require.main === module) {
    var server = app.listen('3001', conf.nodeListenAddr, function () {
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
