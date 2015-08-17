/**
 * Here are Root-Level Hooks (http://mochajs.org/) will run before/after any cases.
 * Used to create/delete testing data.
 * Created by Ting on 2015/7/23.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');
var Doctor = util.app.models.Doctor;
var Patient = util.app.models.Patient;

before(function (done) {
  var testData = {};
  var prepareManualTestDoctors = function () {
    console.log('* Preparing doctors for manual test...');
    var mockDoctors = util.conf.testData.doctors.concat();
    prepareDoctorsData(mockDoctors, function () {
      prepareManualTestPatients();
    });
  };

  var prepareManualTestPatients = function () {
    console.log('* Preparing patients for manual test...');
    var mockPatients = util.conf.testData.patients.concat();
    preparePatientsData(mockPatients, function () {
      prepareUnitTestDoctors();
    });
  };

  var prepareUnitTestDoctors = function () {
    console.log('* Preparing doctors for unit test...');
    var mockDoctors = util.conf.testData.unitDoctors.concat();
    prepareDoctorsData(mockDoctors, function (users) {
      saveTestData(users, 'doctor');
      prepareUnitTestPatients();
    });
  };

  var prepareUnitTestPatients = function () {
    console.log('* Preparing patients for unit test...');
    var mockPatients = util.conf.testData.unitPatients.concat();
    preparePatientsData(mockPatients, function (users) {
      saveTestData(users, 'patient');
      process.env.testData = JSON.stringify(testData);
      done();
    });
  };

  var saveTestData = function (users, keyPrefix) {
    for (var i = 0; i < users.length; i++) {
      var idx = i + 1 + '';
      testData[keyPrefix + idx] = {id: users[i].id, openid: users[i].wechat.openid};
    }
  };

  var prepareDoctorsData = function (mockDoctors, callback) {
    var testDoctorsOpenIds = getOpenidArray(mockDoctors);
    // find test data, will not create again if they are exist.
    var filter = {'wechat.openid': {'$in': testDoctorsOpenIds}};
    Doctor.find(filter, function (err, doctors) {
      if (err) return done(err);
      // only create mock doctors which not in db.
      if (doctors.length != mockDoctors.length) {
        removeExistsFromMock(mockDoctors, doctors);
        getModelMaxNumber(Doctor, function (err, maxNumber) {
          if (err) return done(err);
          for (var i = 0; i < mockDoctors.length; i++) {
            mockDoctors[i].services = util.conf.testData.doctorService;
            mockDoctors[i].number = maxNumber + i + 1;
          }

          Doctor.create(mockDoctors, function (err, created) {
            if (err) return done(err);
            console.log('insert %d doctors data success.', mockDoctors.length);
            callback(created);
          });
        });
      } else {
        console.log('Doctors data already exists.');
        callback(doctors);
      }
    });
  };

  var preparePatientsData = function (mockPatients, callback) {
    var testPatientOpenId = getOpenidArray(mockPatients);
    // find test data, will not create again if they are exist.
    var patientFilter = {'wechat.openid': {'$in': testPatientOpenId}};
    Patient.find(patientFilter, function (err, patients) {
      if (err) return done(err);
      // only create mock patients which not in db.
      if (patients.length != mockPatients.length) {
        removeExistsFromMock(mockPatients, patients);
        getModelMaxNumber(Patient, function (err, maxNumber) {
          if (err) return done(err);
          for (var i = 0; i < mockPatients.length; i++) {
            mockPatients[i].number = maxNumber + i + 1;
          }
          Patient.create(mockPatients, function (err, created) {
            if (err) return done(err);
            console.log('insert %d patients data success.', mockPatients.length);
            callback(created);
          });
        });

      } else {
        console.log('Patients data already exists.');
        callback(patients);
      }
    });
  };

  var removeExistsFromMock = function (mockUsers, dbUsers) {
    for (var i in dbUsers) {
      for (var j in mockUsers) {
        if (mockUsers[i].wechat.openid == mockUsers[j].wechat.openid) {
          // remove exists doctors.
          mockUsers.splice(j, 1);
          break;
        }
      }
    }
  };

  var getOpenidArray = function (users) {
    var openids = [];
    for (var i = 0; i < users.length; i++) {
      openids.push(users[i].wechat.openid);
    }
    return openids;
  };

  var getModelMaxNumber = function (Model, callback) {
    Model.find({}, 'number').limit(1).sort({'number': -1}).exec(function (err, max) {
      if (err) return callback(err);
      var maxNumber = max.length > 0 ? max[0].number : 10000;
      callback(null, maxNumber);
    });
  };

  prepareManualTestDoctors();
});

after(function (done) {
  var getOpenidArray = function (users) {
    var openids = [];
    for (var i = 0; i < users.length; i++) {
      openids.push(users[i].wechat.openid);
    }
    return openids;
  };

  var deleteUnitTestDoctors = function () {
    console.log('* Delete doctors for unit test...');
    var mockDoctors = util.conf.testData.unitDoctors.concat();
    var openids = getOpenidArray(mockDoctors);
    Doctor.remove({'wechat.openid': {'$in': openids}}, function (err) {
      if (err) return done(err);
      console.log('deleted %d doctors.', mockDoctors.length);
      deleteUnitTestPatients();
    });
  };

  var deleteUnitTestPatients = function () {
    console.log('* Delete patients for unit test...');
    var mockPatients = util.conf.testData.unitPatients.concat();
    var openids = getOpenidArray(mockPatients);
    Patient.remove({'wechat.openid': {'$in': openids}}, function (err) {
      if (err) return done(err);
      console.log('deleted %d doctors.', mockPatients.length);
      done();
    });
  };

  deleteUnitTestDoctors();
});
