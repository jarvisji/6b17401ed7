/**
 * This is a script to process order status, it should be ran as cron job.
 * Mainly logic:
 * 1. If order was not paid in 24 hours, change it to 'expired'.
 * 2. If current date (ignore time) is after order end time, change it to 'finished'.
 *    (for jiahao and huizhen, it's the day of booking time; for suizhen, it's the last date of booking months).
 * 3. If order finished, check patient/doctor level. Doctor become 'real' level, patient become 'regular' level.
 * Created by Ting on 2015/8/12.
 */

var mongoose = require('mongoose');
var debug = require('debug')('ylb.job');
var conf = require('./conf');
var models = require('./models');
var consts = require('./utils/consts');

var ServiceOrder = models.ServiceOrder;
var Doctor = models.Doctor;
var Patient = models.Patient;
if (require.main === module) {
  // An array containing the command line arguments.
  // The first element will be 'node', the second element will be the name of the JavaScript file.
  // The next elements will be any additional command line arguments.
  // https://nodejs.org/api/process.html#process_process_argv
  var isTestMode = false;
  if (process.argv.length > 2) {
    isTestMode = process.argv[2] === '-test';
  }
  debug('processOrderStatus starting... testMode: %s', isTestMode);


  // connect to MongoDB
  if (mongoose.connection.readyState != mongoose.STATES.connected && mongoose.connection.readyState != mongoose.STATES.connecting) {
    debug('Connecting to MongoDB: %s', conf.mongoDbUrl);
    mongoose.connect(conf.mongoDbUrl);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function (callback) {
      debug('Connected to MongoDB success');
      doProcess(isTestMode);
    });
  } else {
    debug('Mongoose connection state: ', mongoose.connection.readyState);
  }
}

var expiredOrdersToProcess = 0;
var finishedOrdersToProcess = 0;
var doctorsToProcess = 0;
var patientsToProcess = 0;
var doProcess = function (isTestMode, callback) {
  var status = [consts.orderStatus.init, consts.orderStatus.confirmed];
  var now = new Date();
  debug('finding orders with status in: %o, current time: %s', status, now.toISOString());
  ServiceOrder.find({status: {'$in': status}}).exec()
    .then(function (orders) {
      debug('found %d match orders.', orders.length);
      for (var i = 0; i < orders.length; i++) {
        var order = orders[i];

        if (order.status == consts.orderStatus.init) {
          // --------------------------------------------
          // find expired orders
          if (now.getTime() - order.created.getTime() > 86400000) {
            expiredOrdersToProcess++;
            order.status = consts.orderStatus.expired;
            order.save(function (err, order) {
              expiredOrdersToProcess--;
              if (err) {
                throw err;
              }
              debug('Expired. updating order: %s, current status: %s, bookingTime: %s.', order.id, order.status, order.bookingTime.toISOString());
            });
          }
        } else if (order.status == consts.orderStatus.confirmed) {
          // --------------------------------------------
          // find finished orders
          if (isTestMode) {
            order.status = consts.orderStatus.finished;
            debug('Test Mode. Update all confirmed order to finished, order: %s', order.id);
          } else {
            if (order.serviceType == consts.doctorServices.jiahao.type || order.serviceType == consts.doctorServices.huizhen.type) {
              if ((now.getDate() > order.bookingTime.getDate()) || (now.getMonth() > order.bookingTime.getMonth())) {
                order.status = consts.orderStatus.finished;
              }
            } else {
              var serviceEndTime = new Date(order.bookingTime);
              serviceEndTime.setMonth(serviceEndTime.getMonth() + order.quantity);
              if (now.getTime() > serviceEndTime.getTime()) {
                order.status = consts.orderStatus.finished;
              }
            }
          }
          if (order.isModified()) {
            finishedOrdersToProcess++;
            order.save(function (err, order) {
              finishedOrdersToProcess--;
              if (err) {
                throw err;
              }
              debug('Finished. updating order: %s, type: %s, current status: %s, bookingTime: %s, quantity: %d', order.id, order.serviceType, order.status, order.bookingTime.toISOString(), order.quantity);
            });
          }
        }
      }

      return Doctor.find({level: {'$lt': 3}}).exec();
    }).then(function (doctors) {
      doctorsToProcess = doctors.length;
      for (var i = 0; i < doctors.length; i++) {
        var doctor = doctors[i];
        ServiceOrder.count({'doctors.id': doctor.id, status: consts.orderStatus.finished}, function (err, count) {
          if (err) {
            doctorsToProcess--;
            throw err;
          }
          if (count > 0) {
            doctor.level = 3;
            doctor.save(function (err, doctor) {
              doctorsToProcess--;
              if (err) {
                throw err;
              }
              debug('Updated doctor level to 3, doctorId; %s', doctor.id);
            })
          } else {
            doctorsToProcess--;
          }
        })
      }

      return Patient.find({level: {'$lt': 2}}).exec();
    }).then(function (patients) {
      patientsToProcess = patients.length;
      for (var i = 0; i < patients.length; i++) {
        var patient = patients[i];
        ServiceOrder.count({'patient.id': patient.id, status: consts.orderStatus.finished}, function (err, count) {
          if (err) {
            patientsToProcess--;
            throw err;
          }
          if (count > 0) {
            patient.level = 2;
            patient.save(function (err, patient) {
              patientsToProcess--;
              if (err) {
                throw err;
              }
              debug('Updated patient level to 2, patientId; %s', patient.id);
            })
          } else {
            patientsToProcess--;
          }
        })
      }

      // waiting all saves finished.
      setInterval(function () {
        if (finishedOrdersToProcess > 0 || expiredOrdersToProcess > 0 || doctorsToProcess > 0 || patientsToProcess > 0) {
          debug('Waiting for saving finished. remain finishedOrdersToProcess: %d, expiredOrdersToProcess: %d, doctorsToProcess: %d, patientsToProcess: %d ', finishedOrdersToProcess, expiredOrdersToProcess, doctorsToProcess, patientsToProcess);
        } else {
          debug('All processes finished.');
          if (require.main === module) {
            process.exit();
          } else {
            if (callback) callback(null);
          }
        }
      }, 1000);
    }).then(null, function (err) {
      debug('Error: %o', err);
      if (require.main === module) {
        process.exit(1);
      } else {
        if (callback) callback(err);
      }
    })
};

module.exports = {
  doProcess: doProcess
};

