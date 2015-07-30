/**
 * Created by Ting on 2015/7/29.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe.only('Tests for APIs of patient cases.', function () {
  var testPatient = util.conf.testData.patients[0];
  var testPatient2 = util.conf.testData.patients[1];
  var testPatient3 = util.conf.testData.patients[2];
  var testDoctor = util.conf.testData.doctors[0];
  var testDoctor2 = util.conf.testData.doctors[1];
  var Doctor = util.app.models.Doctor;
  var Patient = util.app.models.Patient;
  var ServiceOrder = util.app.models.ServiceOrder;
  var PatientFriend = util.app.models.PatientFriend;
  var patientId, patientId2, patientId3, doctorId;

  before(function (done) {
    Patient.findOne({'wechat.openid': testPatient.wechat.openid}).exec()
      .then(function (patient) {
        patientId = patient.id;
        return Patient.findOne({'wechat.openid': testPatient2.wechat.openid}).exec();
      }).then(function (patient) {
        patientId2 = patient.id;
        return Patient.findOne({'wechat.openid': testPatient3.wechat.openid}).exec();
      }).then(function (patient) {
        patientId3 = patient.id;
        return Doctor.findOne({'wechat.openid': testDoctor.wechat.openid}).exec();
      }).then(function (doctor) {
        doctorId = doctor.id;
        // make sure patient and patient2 are friends.
        return PatientFriend.find({
          "$or": [{
            from: patientId,
            to: patientId2,
            status: util.app.consts.friendStatus.accepted
          }, {
            from: patientId2,
            to: patientId,
            status: util.app.consts.friendStatus.accepted
          }]
        }).exec();
      }).then(function (friends) {
        if (friends.length == 0) {
          PatientFriend.create({
            from: patientId,
            to: patientId2,
            status: util.app.consts.friendStatus.accepted
          }, function (err) {
            if (err) return done(err);
            done();
          })
        } else {
          done();
        }
      }).then(null, function (err) {
        done(err);
      });
  });

  it('Create case will success because created by patient self.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .send({content: 'test case'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var createdCase = res.body.data;
        should(createdCase.content).equal('test case');
        should(createdCase.creator.id).equal(patientId);
        should(createdCase.creator.name).equal(testPatient.name);
        should(createdCase.creator.role).equal(util.app.consts.role.patient);
        done();
      });
  });

  it('Create case will success because doctor has order relationship.', function (done) {
    ServiceOrder.find({doctorId: doctorId, patientId: patientId}).exec()
      .then(function (orders) {
        if (orders.length > 0) {
          callApi();
        } else {
          ServiceOrder.create({doctorId: doctorId, patientId: patientId}, function (err) {
            if (err) return done(err);
            callApi();
          });
        }
      });

    var callApi = function () {
      util.req.json('post', '/api/patients/' + patientId + '/cases?openid=' + testDoctor.wechat.openid + '&role=' + util.app.consts.role.doctor)
        .send({content: 'test case'})
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          var createdCase = res.body.data;
          should(createdCase.content).equal('test case');
          should(createdCase.creator.id).equal(doctorId);
          should(createdCase.creator.name).equal(testDoctor.name);
          should(createdCase.creator.role).equal(util.app.consts.role.doctor);
          done();
        });
    }
  });

  it('Create case will fail because wrong link type.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .send({content: 'test case', link: {type: 'wrongType'}})
      .expect(400, done);
  });

  it('Create case will fail because blank content.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .send({link: {type: 'image'}})
      .expect(400, done);
  });

  it('Create case will fail because other patient has no privilege.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases?openid=' + testPatient2.wechat.openid + '&role=' + util.app.consts.role.patient)
      .send({content: 'test case'})
      .expect(403, done);
  });

  it('Create case will fail because doctor has no privilege without order relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases?openid=' + testDoctor2.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .send({content: 'test case'})
      .expect(403, done);
  });

  /* --- get cases ----------------------------------------------------------------------------*/
  it('Get cases will success because by patient self.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var cases = res.body.data;
        should(cases.length).greaterThan(0);
        done();
      });
  });

  it('Get cases will success because by doctor which have order relationship.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases?openid=' + testDoctor.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var cases = res.body.data;
        should(cases.length).greaterThan(0);
        done();
      });
  });

  it('Get cases will success because by patient which have friend relationship.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases?openid=' + testPatient2.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var cases = res.body.data;
        should(cases.length).greaterThan(0);
        done();
      });
  });

  it('Get cases will fail because by patient which have NO friend relationship.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases?openid=' + testPatient3.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Get cases will fail because by doctor which have NO order relationship.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases?openid=' + testDoctor2.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(403, done);
  });
});
