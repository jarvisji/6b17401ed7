/**
 Created by Ting on 2015/7/17.
 */
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var wechatApi = require('wechat-api');
var debug = require('debug')('ylb.app');
var conf = require('./conf');
var wechatOAuth = require('./middleware/wechat-oauth');

var app = express();
gApp = app; // global
app.use(express.static('client'));
app.use('/upload', express.static('upload'));
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
    app.consts = require('./utils/consts');
  }
};

var registerRoutes = function () {
  debug('Register routes...');
  var api = new wechatApi(conf.wechat.appid, conf.wechat.appsecret);
  var wxproxyDoctor = require('./middleware/wxproxy-doctor')(app, api);
  var wxproxyPatient = require('./middleware/wxproxy-patient')(app, api);
  var doctorCtrl = require('./controller/doctor-controller')(app, api);
  var patientCtrl = require('./controller/patient-controller')(app, api);
  var orderCtrl = require('./controller/order-controller')(app);
  var wechatCtrl = require('./controller/wechat-controller')(app, api);

  // TODO: add authentication for following APIs.
  app.use('/wxproxy', wxproxyDoctor); // TODO: delete this.
  app.use('/wxproxy-doctor', wxproxyDoctor);
  app.use('/wxproxy-patient', wxproxyPatient);

  app.post('/wechat/menu', wechatCtrl.createMenu);
  app.get('/wechat/jssdkconfig', wechatCtrl.getJsSdkConfig);
  app.get('/api/verify', wechatCtrl.verifyAccessToken); // verify openid and access_token, then return registered user information.

  app.use(wechatOAuth);
  /* -- The following APIs need 'Authorization' header--------------------------------------------------------*/
  app.post('/api/doctors', doctorCtrl.createDoctor);
  app.get('/api/doctors', doctorCtrl.findDoctors);
  app.get('/api/doctors/:id', doctorCtrl.getDoctor);
  app.put('/api/doctors/:id', doctorCtrl.saveDoctor);
  /**
   * POST '/api/doctors/:id/friends/requests'
   * Data: {'toDoctorId': 'String', 'message': 'String'}
   * Add a doctor as a friend to the doctor which 'id' identify.
   */
  app.post('/api/doctors/:id/friends/requests', doctorCtrl.createFriendsRequests);
  app.get('/api/doctors/:id/friends/requests', doctorCtrl.getFriendsRequests);
  app.put('/api/doctors/friends/requests/:reqId/acceptance', doctorCtrl.acceptFriendsRequests);
  app.put('/api/doctors/friends/requests/:reqId/rejection', doctorCtrl.rejectFriendsRequests);
  app.delete('/api/doctors/friends/requests/:reqId', doctorCtrl.deleteFriendsRequests);
  /**
   * GET '/api/doctors/friends/:id1/:id2'
   * Response: doctorFriendSchema if exist.
   * Check the friend relationship between two doctors.
   */
  app.get('/api/doctors/friends/:id1/:id2', doctorCtrl.getFriendsRequestsStatus);
  app.get('/api/doctors/:id/friends', doctorCtrl.getFriends);

  /**
   * Get service stock of given doctor.
   * Response: For 'jiahao', return remain counts of this week and next week.
   */
  app.get('/api/doctors/:id/serviceStock', doctorCtrl.getServiceStock);
  /**
   * Get the patients those have relations with the given doctor.
   * Response: List of patients.
   */
  app.get('/api/doctors/:id/patientRelations', doctorCtrl.getPatientRelations);
  /**
   * GET '/api/doctors/:id/patients/cases'
   * Get the cases of all the related patients, order by time desc.
   */
  app.get('/api/doctors/:id/patients/cases', doctorCtrl.getPatientsCases);

  /**
   * Get order history of doctor.
   * Get unfinished orders is implemented in orderCtrl.
   */
  app.get('/api/doctors/:id/orders/history', doctorCtrl.getDoctorOrders);
  /**
   * Get account summary of doctor. Include balance of in trading, finished, and extracted.
   */
  app.get('/api/doctors/:id/orders/summary', doctorCtrl.getDoctorOrdersSummary);

  /* Patient APIs ----------------------------------------------------------------------------------------*/
  app.get('/api/patients', patientCtrl.find);
  app.get('/api/patients/:id', patientCtrl.getPatient);
  app.put('/api/patients/:id', patientCtrl.save);
  /**
   * POST '/api/patient/:id/friends/requests'
   * Data: {'toPatientId': 'String', 'message': 'String'}
   * Add a patient as a friend to the patient which 'id' identify.
   */
  app.post('/api/patients/:id/friends/requests', patientCtrl.createFriendsRequests);
  app.get('/api/patients/:id/friends/requests', patientCtrl.getFriendsRequests);
  app.put('/api/patients/friends/requests/:reqId/acceptance', patientCtrl.acceptFriendsRequests);
  app.put('/api/patients/friends/requests/:reqId/rejection', patientCtrl.rejectFriendsRequests);
  app.delete('/api/patients/friends/requests/:reqId', patientCtrl.deleteFriendsRequests);
  /**
   * GET '/api/patients/friends/:id1/:id2'
   * Response: patientFriendSchema if exist.
   * Check the friend relationship between two patients.
   */
  app.get('/api/patients/friends/:id1/:id2', patientCtrl.getFriendsRequestsStatus);
  app.get('/api/patients/:id/friends', patientCtrl.getFriends);
  /**
   * Get the relations for all doctors those have relations with the given patient.
   * Response: List of DoctorPatientRelation.
   */
  app.get('/api/patients/:id/doctorRelations', patientCtrl.getDoctorRelations);
  /**
   * Get all doctors those have relations with the given patient.
   * Response: List of Doctor.
   */
  app.get('/api/patients/:id/doctors', patientCtrl.getDoctors);
  /**
   * Get order history of patient.
   * Get unfinished orders is implemented in orderCtrl.
   */
  app.get('/api/patients/:id/orders/history', patientCtrl.getPatientFinishedOrders);
  /**
   * Get account summary of patient. Include balance of in rejected orders and extracted amount.
   */
  app.get('/api/patients/:id/orders/summary', patientCtrl.getPatientOrdersSummary);

  /**
   * GET '/api/patients/:id/follows?[expand=true]'
   * Get doctors list that a patient follows.
   */
  //app.get('/api/patients/:id/follows', patientCtrl.getFollows);

  /* -- Patient APIs - Cases ------------------------------------------------------------------------------*/
  app.post('/api/patients/:id/cases', patientCtrl.createCase);
  /**
   * Response array of caseHistorySchema.Each case contains all it's comments.
   */
  app.get('/api/patients/:id/cases', patientCtrl.getCases);
  app.delete('/api/patients/:id/cases/:caseId', patientCtrl.deleteCase);
  app.post('/api/patients/:id/cases/:caseId/comments', patientCtrl.createCaseComment);
  app.delete('/api/patients/:id/cases/:caseId/comments/:commentId', patientCtrl.deleteCaseComment);
  app.get('/api/patients/:id/cases/postPrivilege', patientCtrl.getCasesPostPrivilege);
  app.get('/api/patients/:id/cases/viewPrivilege', patientCtrl.getCasesViewPrivilege);
  app.get('/api/patients/:id/friends/cases', patientCtrl.getFriendCases);

  /* -- Order APIs ------------------------------------------------------------------------------*/
  app.post('/api/orders', orderCtrl.createOrder);
  app.put('/api/orders/:id', orderCtrl.updateOrder);
  app.put('/api/orders/:id/status/:status', orderCtrl.updateOrderStatus);
  app.get('/api/orders/my', orderCtrl.getOrders); // all unfinished orders.
  //app.get('/api/orders/my/history', orderCtrl.getHistoryOrders);
  //app.get('/api/orders/my/all', orderCtrl.getAllOrders);
  app.get('/api/orders/:id', orderCtrl.getOrderDetail);
  app.post('/api/orders/:id/comments', orderCtrl.createComment);
  app.delete('/api/orders/:id/comments/:commentId', orderCtrl.deleteComment);

  /* -- Relation APIs ------------------------------------------------------------------------------*/
  /**
   * POST '/api/patients/:id/follows'
   * @Data: {"doctorId":"string", "patientId":"string"}
   */
  app.post('/api/relations/normal', patientCtrl.createFollow);
  app.delete('/api/relations/:relationId', patientCtrl.deleteRelation);

  /**
   * GET '/api/relations/doctor/:doctorId/patient/:patientId'
   * Get relation between patient and doctor.
   * @Response: {data: true/false}
   */
  app.get('/api/relations/doctor/:doctorId/patient/:patientId', patientCtrl.getRelation);
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
