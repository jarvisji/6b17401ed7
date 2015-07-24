/**
 * Created by Ting on 2015/7/23.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe.only('Test patient follow doctor.', function () {
  var patient, doctor;

  before('Get registered data of patient and doctor', function (done) {
    var testPatient = util.conf.testData.patients[0];
    var testDoctor = util.conf.testData.doctors[0];
    var Doctor = util.app.models.Doctor;
    var Patient = util.app.models.Patient;

    var patientPromise = Patient.find({'wechat.openid': testPatient.wechat.openid}).exec();
    var doctorPromise = Doctor.find({'wechat.openid': testDoctor.wechat.openid}).exec();
    patientPromise.then(function (patients) {
      if (patients.length == 0) {
        done(new Error('no patient data found.'));
      }
      patient = patients[0];
      return doctorPromise;
    }).then(function (doctors) {
      if (doctors.length == 0) {
        done(new Error('no doctor data found.'));
      }
      doctor = doctors[0];
      console.log('Testing data. patientId: %s, doctorId: %s.', patient._id, doctor._id);
      done();
    })
  });

  it('Make sure test data is clean', function (done) {
    util.req.json('get', '/api/patients/' + patient._id + '/follows')
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.data).is.a.Array();
        should(res.body.data.length).equal(0);
        done();
      });
  });

  it('Test create follow', function (done) {
    util.req.json('post', '/api/patients/' + patient._id + '/follows')
      .send({'doctorId': doctor._id})
      .expect(201, done);
  });

  it('Test create follow non exist doctor', function (done) {
    var nonExistDoctorId = new mongoose.Types.ObjectId;
    util.req.json('post', '/api/patients/' + patient._id + '/follows')
      .send({'doctorId': nonExistDoctorId})
      .expect(404, done);
  });

  it('Verify created follow', function (done) {
    util.req.json('get', '/api/patients/' + patient._id + '/follows')
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.data).is.a.Array();
        should(res.body.data.length).equal(1);
        should(res.body.data[0]).equal(doctor.id);
        done();
      });
  });

  it('Verify created follow with embed doctor', function (done) {
    util.req.json('get', '/api/patients/' + patient._id + '/follows?embed=doctor')
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        should(res.body.data).is.a.Array();
        should(res.body.data.length).equal(1);
        should(res.body.data[0].id).equal(doctor.id);
        should(res.body.data[0]).have.property('doctor');
        done();
      });
  });

  it('Test delete follow', function (done) {
    util.req.json('delete', '/api/patients/' + patient._id + '/follows/' + doctor._id)
      .expect(200)
      .end(function (err, res) {
        if (err) done(err);
        util.req.json('get', '/api/patients/' + patient._id + '/follows')
          .expect(200)
          .end(function (err, res) {
            if (err) done(err);
            should(res.body.data).is.a.Array();
            should(res.body.data.length).equal(0);
            done();
          });
      })
  });
});
