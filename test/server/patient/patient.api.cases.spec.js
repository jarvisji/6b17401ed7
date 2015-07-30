/**
 * Created by Ting on 2015/7/29.
 */
var mongoose = require('mongoose');
var should = require('should');
var util = require('../testUtils');

describe.only('Tests for APIs of patient cases.', function () {
  var testPatient = util.conf.testData.patients[0];
  var testPatient2 = util.conf.testData.patients[1]; // friend with testPatient
  var testPatient3 = util.conf.testData.patients[2]; // not friend with testPatient
  var testDoctor = util.conf.testData.doctors[0]; // has order with testPatient
  var testDoctor2 = util.conf.testData.doctors[1];// has no order with testPatient
  var Doctor = util.app.models.Doctor;
  var Patient = util.app.models.Patient;
  var ServiceOrder = util.app.models.ServiceOrder;
  var PatientFriend = util.app.models.PatientFriend;
  var patientId, patientId2, patientId3, doctorId, doctorId2, caseIdBySelf, caseIdByDoctor, commendIdBySelf, commendIdByPatient, commendIdByDoctor;

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
        return Doctor.findOne({'wechat.openid': testDoctor.wechat.openid}).exec();
      }).then(function (doctor) {
        doctorId2 = doctor.id;
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
        // make sure patient and patient2 are friends.
        if (friends.length == 0) {
          PatientFriend.create({
            from: patientId,
            to: patientId2,
            status: util.app.consts.friendStatus.accepted
          }, function (err) {
            if (err) return done(err);
          })
        }
        return PatientFriend.find({
          "$or": [{
            from: patientId,
            to: patientId3,
            status: util.app.consts.friendStatus.accepted
          }, {
            from: patientId3,
            to: patientId,
            status: util.app.consts.friendStatus.accepted
          }]
        }).exec();
      }).then(function (friends) {
        // make sure patient and patient3 are NOT friends.
        if (friends.length > 0) {
          for (var i = 0; i < friends.length; i++) {
            PatientFriend.remove({_id: friends[i].id}, function (err, ret) {
              if (err) return done(err);
            })
          }
        }
        return ServiceOrder.find({doctorId: doctorId2, patientId: patientId}).exec();
      }).then(function (orders) {
        // make sure doctor2 and patient has NO orders
        if (orders.length > 0) {
          for (var i = 0; i < orders.length; i++) {
            ServiceOrder.remove({_id: orders[i].id}, function (err, ret) {
              if (err) return done(err);
            })
          }
        }
        return ServiceOrder.find({doctorId: doctorId, patientId: patientId}).exec();
      }).then(function (orders) {
        // make sure doctor and patient has orders
        if (orders.length == 0) {
          ServiceOrder.create({doctorId: doctorId, patientId: patientId}, function (err) {
            if (err) return done(err);
            done();
          });
        } else {
          done();
        }
      }).then(null, function (err) {
        done(err);
      });
  });

  /* --- create cases ----------------------------------------------------------------------------*/
  it('Create case will success because created by patient self.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .send({content: 'test case'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var createdCase = res.body.data;
        caseIdBySelf = createdCase._id;
        should(createdCase.content).equal('test case');
        should(createdCase.creator.id).equal(patientId);
        should(createdCase.creator.name).equal(testPatient.name);
        should(createdCase.creator.role).equal(util.app.consts.role.patient);
        done();
      });
  });

  it('Create case will success because doctor has order relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases?openid=' + testDoctor.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .send({content: 'test case'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var createdCase = res.body.data;
        caseIdByDoctor = createdCase._id;
        should(createdCase.content).equal('test case');
        should(createdCase.creator.id).equal(doctorId);
        should(createdCase.creator.name).equal(testDoctor.name);
        should(createdCase.creator.role).equal(util.app.consts.role.doctor);
        done();
      });
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

  /* --- create case comment ----------------------------------------------------------------------------*/
  it('Create case comment will success because by patient self.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200)
      .send({comment: 'test comment'})
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(1);
        should(updatedCase.comments[0].comment).equal('test comment');
        should(updatedCase.comments[0].creator.id).equal(patientId);
        commendIdBySelf = updatedCase.comments[0]._id;
        done();
      });
  });

  it('Create case comment will success because by doctor which have order relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments?openid=' + testDoctor.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(200)
      .send({comment: 'test comment1'})
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(2);
        should(updatedCase.comments[1].comment).equal('test comment1');
        should(updatedCase.comments[1].creator.id).equal(doctorId);
        commendIdByDoctor = updatedCase.comments[1]._id;
        done();
      });
  });

  it('Create case comment will success because by patient which have friend relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments?openid=' + testPatient2.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200)
      .send({comment: 'test comment2'})
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(3);
        should(updatedCase.comments[2].comment).equal('test comment2');
        should(updatedCase.comments[2].creator.id).equal(patientId2);
        commendIdByPatient = updatedCase.comments[2]._id;
        done();
      });
  });

  it('Create case comment will fail because by patient which have NO friend relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments?openid=' + testPatient3.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Create case comment will fail because by doctor which have NO order relationship.', function (done) {
    util.req.json('post', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments?openid=' + testDoctor2.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(403, done);
  });

  /* --- delete case comment ----------------------------------------------------------------------------*/
  it('Delete case comment will fail because comment created by others.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdByDoctor + '?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Delete case comment will fail because comment created by others.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdByPatient + '?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Delete case comment will success because it was created by patient self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdBySelf + '?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(2);
        done();
      });
  });

  it('Delete case comment will success because it was created by doctor self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdByDoctor + '?openid=' + testDoctor.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(1);
        done();
      });
  });

  it('Delete case comment will success because it was created by another patient self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '/comments/' + commendIdByPatient + '?openid=' + testPatient2.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        var updatedCase = res.body.data;
        should(updatedCase.comments.length).equal(0);
        done();
      });
  });

  /* --- delete case ----------------------------------------------------------------------------*/
  it('Delete case will fail because comment created by others.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdByDoctor + '?openid=' + testPatient2.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(403, done);
  });

  it('Delete case will fail because comment created by others.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '?openid=' + testDoctor.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(403, done);
  });

  it('Delete case will success because it was created by patient self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdBySelf + '?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200, done);
  });

  it('Delete case will success because it was created by doctor self.', function (done) {
    util.req.json('delete', '/api/patients/' + patientId + '/cases/' + caseIdByDoctor + '?openid=' + testDoctor.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(200, done);
  });

  /* --- check post case privilege ----------------------------------------------------------------*/
  it('Check case post privilege will success because is patient self.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege' + '?openid=' + testPatient.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200, done);
  });
  it('Check case post privilege will success because patient is friend.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege' + '?openid=' + testPatient2.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(200, done);
  });
  it('Check case post privilege will success because doctor has orders.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege' + '?openid=' + testDoctor.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(200, done);
  });
  it('Check case post privilege will fail because patient is not friend.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege' + '?openid=' + testPatient3.wechat.openid + '&role=' + util.app.consts.role.patient)
      .expect(403, done);
  });
  it('Check case post privilege will fail because doctor has no orders.', function (done) {
    util.req.json('get', '/api/patients/' + patientId + '/cases/postPrivilege' + '?openid=' + testDoctor2.wechat.openid + '&role=' + util.app.consts.role.doctor)
      .expect(403, done);
  });
});
