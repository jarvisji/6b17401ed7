/**
 * Here are Root-Level Hooks (http://mochajs.org/) will run before/after any cases.
 * Used to create/delete testing data.
 * Created by Ting on 2015/7/23.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

before(function (done) {
  console.log('Preparing test data for doctor................');
  var testDoctorsOpenId = [];
  var mockDoctors = util.conf.testData.doctors.concat();
  for (var i = 0; i < mockDoctors.length; i++) {
    testDoctorsOpenId.push(mockDoctors[i].wechat.openid);
  }
  var Doctor = util.app.models.Doctor;
  // find test data, will not create again if they are exist.
  var filter = {'wechat.openid': {'$in': testDoctorsOpenId}};
  Doctor.find(filter, function (err, found) {
    if (err) return done(err);
    console.log('trying to insert %d test doctors.', mockDoctors.length);
    console.log('found %d test doctors in db.', found.length);
    // only create mock doctors which not in db.
    if (found.length != mockDoctors.length) {
      for (var i in found) {
        for (var j in mockDoctors) {
          if (found[i].mobile == mockDoctors[j].mobile) {
            mockDoctors.splice(j, 1);
            break;
          }
        }
      }

      Doctor.find({}, 'number').limit(1).sort({'number': -1}).exec(function (err, maxNumberDoctor) {
        if (err) return done(err);
        var maxNumber = maxNumberDoctor.length > 0 ? maxNumberDoctor[0].number : 0;
        console.log('max number of doctors is: %d', maxNumber);
        // set number.
        for (var i = 0; i < mockDoctors.length; i++) {
          mockDoctors[i].services = util.conf.testData.doctorService;
          mockDoctors[i].number = maxNumber + i + 1;
        }

        Doctor.create(mockDoctors, function (err, createdDoctors) {
          if (err) done(err);
          console.log('insert test doctors success.');
          //done();
        });
      });
    } else {
      console.log('no data to be inserted.');
    }
  });

  console.log('Preparing test data for patient................');
  var testPatientOpenId = [];
  var mockPatient = util.conf.testData.patients.concat();
  for (var j = 0; j < mockPatient.length; j++) {
    testPatientOpenId.push(mockPatient[j].wechat.openid);
  }
  var Patient = util.app.models.Patient;
  // find test data, will not create again if they are exist.
  var patientFilter = {'wechat.openid': {'$in': testPatientOpenId}};
  Patient.find(patientFilter, function (err, found) {
    if (err) return done(err);
    console.log('trying to insert %d test patients.', mockPatient.length);
    console.log('found %d test patients in db.', found.length);
    // only create mock patients which not in db.
    if (found.length != mockPatient.length) {
      for (var i in found) {
        for (var j in mockPatient) {
          if (found[i].mobile == mockPatient[j].mobile) {
            mockPatient.splice(j, 1);
            break;
          }
        }
      }

      Patient.find({}, 'number').limit(1).sort({'number': -1}).exec(function (err, maxNumberPatient) {
        if (err) return done(err);
        var maxNumber = maxNumberPatient.length > 0 ? maxNumberPatient[0].number : 0;
        console.log('max number of patients is: %d', maxNumber);
        // set number.
        for (var i = 0; i < mockPatient.length; i++) {
          mockPatient[i].number = maxNumber + i + 1;
        }

        Patient.create(mockPatient, function (err, createdPatients) {
          if (err) return done(err);
          console.log('insert test patients success.');
          done();
        });
      });
    } else {
      console.log('no data to be inserted.');
      done();
    }
  });
});

after(function () {
  //console.log('Deleting test data................');
});
